import { useState, useMemo, useCallback, useEffect } from 'react';
import { endOfMonth, startOfWeek, endOfWeek, addDays, parseISO, isValid } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/components/ui/use-toast';

const weekStartsOnMonday = { weekStartsOn: 1 };

const normalize = (value) => (value || '').toString().toLowerCase();

const buildWeeksForMonth = (year, month) => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = endOfMonth(firstDay);
  let cursor = startOfWeek(firstDay, weekStartsOnMonday);
  const weeks = [];

  while (cursor <= lastDay) {
    const weekStart = cursor;
    const weekEnd = endOfWeek(weekStart, weekStartsOnMonday);
    weeks.push({
      name: `Semana ${weeks.length + 1}`,
      startDate: weekStart < firstDay ? firstDay : weekStart,
      endDate: weekEnd > lastDay ? lastDay : weekEnd,
    });
    cursor = addDays(weekEnd, 1);
  }

  return weeks;
};

const parseLeadDate = (lead) => {
  const rawDate = lead?.custom_date_field || lead?.data_entrada || lead?.created_at;
  if (!rawDate) return null;
  const parsed = parseISO(rawDate);
  return isValid(parsed) ? parsed : null;
};

const defaultMonthlyMetrics = {
  investimento: 0,
  totalLeads: 0,
  agendamentos: 0,
  comparecimentos: 0,
  vendas: 0,
  valorVendas: 0,
  ticketMedio: 0,
  roas: 0,
  custoPorLead: 0,
  custoPorVenda: 0,
  taxaLeadAgendamento: 0,
  taxaAgendamentoComparecimento: 0,
  taxaComparecimentoVenda: 0,
  taxaLeadVenda: 0,
};

const useWeeklyData = (leads = []) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();

  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedOrigens, setSelectedOrigens] = useState([]);
  const [selectedSubOrigens, setSelectedSubOrigens] = useState([]);
  const [weeklyInvestments, setWeeklyInvestments] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState(defaultMonthlyMetrics);
  const [loading, setLoading] = useState(true);

  const weeks = useMemo(
    () => buildWeeksForMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const analyticsMappings = settings?.analytics_mappings || {};
  const agendamentoStatuses = analyticsMappings.agendamento_statuses || [];
  const comparecimentoStatuses = analyticsMappings.comparecimento_statuses || [];
  const vendaStatuses = analyticsMappings.venda_statuses?.length
    ? analyticsMappings.venda_statuses
    : ['vendeu'];

  const origemOptions = useMemo(() => {
    const base = settings?.origins || [];
    const fromLeads = (leads || []).map((lead) => lead?.origem).filter(Boolean);
    const unique = Array.from(new Set([...base, ...fromLeads]));
    return unique.sort((a, b) => normalize(a).localeCompare(normalize(b)));
  }, [settings, leads]);

  const subOrigemOptions = useMemo(() => {
    const mapping = settings?.sub_origins || {};
    let base = [];

    if (selectedOrigens.length > 0) {
      selectedOrigens.forEach((origin) => {
        base = [...base, ...(mapping[origin] || [])];
      });
    } else {
      base = Object.values(mapping).flat();
    }

    const fromLeads = (leads || [])
      .filter((lead) =>
        selectedOrigens.length === 0
          ? true
          : selectedOrigens.some((origin) => normalize(origin) === normalize(lead?.origem))
      )
      .map((lead) => lead?.sub_origem)
      .filter(Boolean);

    const unique = Array.from(new Set([...base, ...fromLeads]));

    return unique.sort((a, b) => normalize(a).localeCompare(normalize(b)));
  }, [settings, leads, selectedOrigens]);

  useEffect(() => {
    setSelectedSubOrigens((current) =>
      current.filter((value) =>
        subOrigemOptions.some((option) => normalize(option) === normalize(value))
      )
    );
  }, [subOrigemOptions]);

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    return leads.filter((lead) => {
      const leadDate = parseLeadDate(lead);
      if (!leadDate) return false;
      if (leadDate.getMonth() + 1 !== selectedMonth || leadDate.getFullYear() !== selectedYear) {
        return false;
      }

      if (
        selectedOrigens.length > 0 &&
        !selectedOrigens.some((origin) => normalize(origin) === normalize(lead?.origem))
      ) {
        return false;
      }

      if (
        selectedSubOrigens.length > 0 &&
        !selectedSubOrigens.some(
          (subOrigin) => normalize(subOrigin) === normalize(lead?.sub_origem)
        )
      ) {
        return false;
      }

      return true;
    });
  }, [leads, selectedMonth, selectedYear, selectedOrigens, selectedSubOrigens]);

  const investmentArrayFallback = useMemo(
    () => weeks.map(() => 0),
    [weeks]
  );

  const loadInvestments = useCallback(async () => {
    if (!user) {
      setWeeklyInvestments(investmentArrayFallback);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setWeeklyInvestments(
          weeks.map((_, index) => Number(data[`week${index + 1}_investment`]) || 0)
        );
      } else {
        setWeeklyInvestments(investmentArrayFallback);
      }
    } catch (error) {
      console.error('Erro ao carregar investimentos semanais:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar investimentos',
        description: error.message,
      });
      setWeeklyInvestments(investmentArrayFallback);
    } finally {
      setLoading(false);
    }
  }, [user, selectedYear, selectedMonth, weeks, investmentArrayFallback, toast]);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  useEffect(() => {
    setWeeklyData(
      weeks.map((week, index) => {
        const leadsInWeek = filteredLeads.filter((lead) => {
          const leadDate = parseLeadDate(lead);
          return leadDate && leadDate >= week.startDate && leadDate <= week.endDate;
        });

        const leadsCount = leadsInWeek.length;

        const agendamentos = leadsInWeek.filter((lead) => {
          if (agendamentoStatuses.length > 0) {
            return agendamentoStatuses.some(
              (status) => normalize(status) === normalize(lead?.status)
            );
          }
          return Boolean(lead?.agendamento);
        }).length;

        const comparecimentos = leadsInWeek.filter((lead) => {
          if (comparecimentoStatuses.length > 0) {
            return comparecimentoStatuses.some(
              (status) => normalize(status) === normalize(lead?.status)
            );
          }
          return Boolean(lead?.attended);
        }).length;

        const vendasLeads = leadsInWeek.filter((lead) =>
          vendaStatuses.some((status) => normalize(status) === normalize(lead?.status))
        );

        const vendas = vendasLeads.length;
        const valorVendas = vendasLeads.reduce(
          (sum, lead) => sum + (Number(lead?.valor) || 0),
          0
        );
        const ticketMedio = vendas > 0 ? valorVendas / vendas : 0;

        const weekInvestment = Number(weeklyInvestments[index]) || 0;
        const roas = weekInvestment > 0 ? valorVendas / weekInvestment : 0;

        const taxaLeadAgendamento = leadsCount > 0 ? agendamentos / leadsCount : 0;
        const taxaAgendamentoComparecimento =
          agendamentos > 0 ? comparecimentos / agendamentos : 0;
        const taxaComparecimentoVenda = comparecimentos > 0 ? vendas / comparecimentos : 0;
        const taxaLeadVenda = leadsCount > 0 ? vendas / leadsCount : 0;

        return {
          id: `${selectedYear}-${selectedMonth}-week-${index + 1}`,
          name: week.name,
          startDate: week.startDate,
          endDate: week.endDate,
          leads: leadsCount,
          agendamentos,
          comparecimentos,
          vendas,
          valorVendas,
          ticketMedio,
          roas,
          taxaLeadAgendamento,
          taxaAgendamentoComparecimento,
          taxaComparecimentoVenda,
          taxaLeadVenda,
          weeklyInvestment: weekInvestment,
          leadsRaw: leadsInWeek,
        };
      })
    );
  }, [
    weeks,
    filteredLeads,
    weeklyInvestments,
    agendamentoStatuses,
    comparecimentoStatuses,
    vendaStatuses,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    const totals = weeklyData.reduce(
      (acc, week) => {
        acc.totalLeads += week.leads;
        acc.agendamentos += week.agendamentos;
        acc.comparecimentos += week.comparecimentos;
        acc.vendas += week.vendas;
        acc.valorVendas += week.valorVendas;
        acc.investimento += week.weeklyInvestment;
        return acc;
      },
      { ...defaultMonthlyMetrics }
    );

    totals.ticketMedio = totals.vendas > 0 ? totals.valorVendas / totals.vendas : 0;
    totals.custoPorLead = totals.totalLeads > 0 ? totals.investimento / totals.totalLeads : 0;
    totals.custoPorVenda = totals.vendas > 0 ? totals.investimento / totals.vendas : 0;
    totals.roas = totals.investimento > 0 ? totals.valorVendas / totals.investimento : 0;
    totals.taxaLeadAgendamento =
      totals.totalLeads > 0 ? totals.agendamentos / totals.totalLeads : 0;
    totals.taxaAgendamentoComparecimento =
      totals.agendamentos > 0 ? totals.comparecimentos / totals.agendamentos : 0;
    totals.taxaComparecimentoVenda =
      totals.comparecimentos > 0 ? totals.vendas / totals.comparecimentos : 0;
    totals.taxaLeadVenda = totals.totalLeads > 0 ? totals.vendas / totals.totalLeads : 0;

    setMonthlyMetrics(totals);
  }, [weeklyData]);

  const handleInvestmentChange = useCallback((index, value) => {
    setWeeklyInvestments((prev) => {
      const next = weeks.map((_, i) => prev[i] || 0);
      next[index] = Number.isFinite(Number(value)) ? Number(value) : 0;
      return next;
    });
  }, [weeks]);

  const saveInvestments = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Acesso necessário',
        description: 'Faça login para salvar seus investimentos.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      user_id: user.id,
      year: selectedYear,
      month: selectedMonth,
      updated_at: new Date().toISOString(),
    };

    weeks.forEach((_, index) => {
      payload[`week${index + 1}_investment`] = Number(weeklyInvestments[index]) || 0;
    });

    setLoading(true);

    try {
      const { error } = await supabase
        .from('investments')
        .upsert(payload, { onConflict: 'user_id,year,month' });

      if (error) throw error;

      toast({
        title: 'Investimentos salvos!',
        description: 'Os valores semanais foram atualizados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar investimentos:', error);
      toast({
        title: 'Erro ao salvar investimentos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, selectedYear, selectedMonth, weeks, weeklyInvestments, toast]);

  const formatCurrency = useCallback((value = 0) => {
    const numberValue = Number(value) || 0;
    return numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    });
  }, []);

  const formatPercent = useCallback((value = 0) => {
    const percent = Number(value) || 0;
    if (!Number.isFinite(percent)) return '0%';
    return `${(percent * 100).toFixed(1)}%`;
  }, []);

  return {
    weeklyInvestments: weeks.map((_, index) => weeklyInvestments[index] || 0),
    handleInvestmentChange,
    saveInvestments,
    loading,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    monthlyMetrics,
    weeklyData,
    formatCurrency,
    formatPercent,
    selectedOrigens,
    setSelectedOrigens,
    origemOptions,
    selectedSubOrigens,
    setSelectedSubOrigens,
    subOrigemOptions,
  };
};

export default useWeeklyData;