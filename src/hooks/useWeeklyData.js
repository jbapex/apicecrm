import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  getYear,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/components/ui/use-toast';
import { parseLeadContactDate, parseLeadSaleOrContactDate } from '@/lib/leadSaleDate.js';
import { getVendaStatuses, isVendaStatus } from '@/lib/vendaMetrics.js';
import {
  parseDataVendaDate,
  dashboardMetricsFromLeads,
  vendasTotaisAlinhados,
  leadVendaLeadPk,
} from '@/lib/vendasAggregation.js';

const weekStartsOnMonday = { weekStartsOn: 1 };

const normalize = (value) => (value || '').toString().toLowerCase();

const defaultLeadVendasBundle = { rows: [], usedTable: false };
const EMPTY_LV_ROWS = [];
const EMPTY_STATUS_LIST = [];

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

const buildWeeksForRange = (start, end) => {
  const rangeStart = startOfDay(start);
  const rangeEnd = endOfDay(end);
  let cursor = startOfWeek(rangeStart, weekStartsOnMonday);
  const weeks = [];

  while (cursor <= rangeEnd) {
    const weekStartRaw = startOfWeek(cursor, weekStartsOnMonday);
    const weekStart = weekStartRaw < rangeStart ? rangeStart : weekStartRaw;
    const weekEndRaw = endOfWeek(cursor, weekStartsOnMonday);
    const weekEndCandidate = endOfDay(weekEndRaw);
    const weekEnd = weekEndCandidate > rangeEnd ? rangeEnd : weekEndCandidate;
    weeks.push({
      name: `Semana ${weeks.length + 1}`,
      startDate: weekStart,
      endDate: weekEnd,
    });
    cursor = addDays(startOfDay(weekEnd), 1);
  }

  return weeks;
};

const statusInList = (leadStatus, list) =>
  Array.isArray(list) &&
  list.length > 0 &&
  list.some((s) => normalize(s) === normalize(leadStatus));

const useWeeklyData = (leads = [], dateRange, leadVendasBundle = defaultLeadVendasBundle) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();

  const today = useMemo(() => new Date(), []);
  const [selectedOrigens, setSelectedOrigens] = useState([]);
  const [selectedSubOrigens, setSelectedSubOrigens] = useState([]);
  const [weeklyInvestments, setWeeklyInvestments] = useState([]);
  const [investmentsLoading, setInvestmentsLoading] = useState(true);
  const [savingInvestments, setSavingInvestments] = useState(false);

  const bundle = leadVendasBundle ?? defaultLeadVendasBundle;
  const lvRows = Array.isArray(bundle.rows) ? bundle.rows : EMPTY_LV_ROWS;
  const lvUsedTable = Boolean(bundle.usedTable);

  const effectiveStart = useMemo(() => {
    const raw = dateRange?.from ?? startOfMonth(today);
    return startOfDay(raw);
  }, [dateRange?.from, today]);

  const effectiveEnd = useMemo(() => {
    const raw = dateRange?.to ?? endOfMonth(effectiveStart);
    return endOfDay(raw);
  }, [dateRange?.to, effectiveStart]);

  const weeks = useMemo(
    () => buildWeeksForRange(effectiveStart, effectiveEnd),
    [effectiveStart, effectiveEnd]
  );

  const analyticsMappings = settings?.analytics_mappings || {};
  const agendamentoStatuses = Array.isArray(analyticsMappings.agendamento_statuses)
    ? analyticsMappings.agendamento_statuses
    : EMPTY_STATUS_LIST;
  const comparecimentoStatuses = Array.isArray(analyticsMappings.comparecimento_statuses)
    ? analyticsMappings.comparecimento_statuses
    : EMPTY_STATUS_LIST;
  const vendaStatuses = useMemo(() => getVendaStatuses(settings), [settings]);

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

  const leadsPassingOrigemFilters = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    return leads.filter((lead) => {
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
  }, [leads, selectedOrigens, selectedSubOrigens]);

  const filteredLeads = useMemo(() => {
    const a = effectiveStart.getTime();
    const b = effectiveEnd.getTime();
    return leadsPassingOrigemFilters.filter((lead) => {
      const entrada = parseLeadContactDate(lead);
      if (!entrada) return false;
      const t = entrada.getTime();
      return t >= a && t <= b;
    });
  }, [leadsPassingOrigemFilters, effectiveStart, effectiveEnd]);

  const leadById = useMemo(
    () => new Map((leads || []).map((l) => [leadVendaLeadPk(l.id), l])),
    [leads]
  );

  const rowPassesOrigemForVendaRow = useCallback(
    (v) => {
      const noOriginFilter = selectedOrigens.length === 0 && selectedSubOrigens.length === 0;
      const lead = leadById.get(leadVendaLeadPk(v.lead_id));
      if (!lead) return noOriginFilter;

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
    },
    [leadById, selectedOrigens, selectedSubOrigens]
  );

  /** Linhas `lead_vendas` coerentes com filtro de origem (Dashboard usa todas; aqui espelhamos o filtro da UI). */
  const vRowsFilteredForOrigem = useMemo(() => {
    if (selectedOrigens.length === 0 && selectedSubOrigens.length === 0) return lvRows;
    return lvRows.filter((v) => rowPassesOrigemForVendaRow(v));
  }, [lvRows, selectedOrigens.length, selectedSubOrigens.length, rowPassesOrigemForVendaRow]);

  const dashboardDm = useMemo(
    () =>
      dashboardMetricsFromLeads(
        leadsPassingOrigemFilters,
        settings,
        effectiveStart,
        effectiveEnd
      ),
    [leadsPassingOrigemFilters, settings, effectiveStart, effectiveEnd]
  );

  /** Mesmo cálculo de vendas/valor do Dashboard e Relatórios (card “Valor Total em Vendas”). */
  const periodVendasAlinhadas = useMemo(
    () => vendasTotaisAlinhados(vRowsFilteredForOrigem, lvUsedTable, dashboardDm),
    [vRowsFilteredForOrigem, lvUsedTable, dashboardDm]
  );

  const investmentArrayFallback = useMemo(() => weeks.map(() => 0), [weeks]);

  const loadInvestments = useCallback(async () => {
    if (!user) {
      setWeeklyInvestments(investmentArrayFallback);
      setInvestmentsLoading(false);
      return;
    }

    setInvestmentsLoading(true);

    try {
      const year = getYear(effectiveStart);
      const month = effectiveStart.getMonth() + 1;

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)
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
      setInvestmentsLoading(false);
    }
  }, [user, effectiveStart, weeks, investmentArrayFallback, toast]);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  const weeklyData = useMemo(() => {
    return weeks.map((week, index) => {
      const leadsInWeek = filteredLeads.filter((lead) => {
        const entrada = parseLeadContactDate(lead);
        if (!entrada) return false;
        const t = entrada.getTime();
        return t >= week.startDate.getTime() && t <= week.endDate.getTime();
      });

      const leadsCount = leadsInWeek.length;

      const agendamentos = leadsInWeek.filter(
        (lead) =>
          Boolean(lead?.agendamento) || statusInList(lead?.status, agendamentoStatuses)
      ).length;

      const comparecimentos = leadsInWeek.filter(
        (lead) =>
          Boolean(lead?.attended) || statusInList(lead?.status, comparecimentoStatuses)
      ).length;

      const saleInWeek = (lead) => {
        const d = parseLeadSaleOrContactDate(lead);
        if (!d) return false;
        const t = d.getTime();
        return t >= week.startDate.getTime() && t <= week.endDate.getTime();
      };

      const leadsVendasNoWeek = leadsPassingOrigemFilters.filter(
        (lead) => isVendaStatus(lead.status, vendaStatuses) && saleInWeek(lead)
      );
      const dmWeek = {
        leadsInRangeByEntrada: leadsInWeek,
        leadsVendasNoPeriodo: leadsVendasNoWeek,
      };

      let vendas;
      let valorVendas;
      let ticketMedio;

      if (lvUsedTable) {
        const rowsInWeek = vRowsFilteredForOrigem.filter((v) => {
          const d = parseDataVendaDate(v.data_venda);
          return (
            d &&
            d.getTime() >= week.startDate.getTime() &&
            d.getTime() <= week.endDate.getTime()
          );
        });
        const vtWeek = vendasTotaisAlinhados(rowsInWeek, true, dmWeek);
        vendas = vtWeek.vendas;
        valorVendas = vtWeek.valorTotal;
        ticketMedio = vendas > 0 ? valorVendas / vendas : 0;
      } else {
        const dmWeekFull = dashboardMetricsFromLeads(
          leadsPassingOrigemFilters,
          settings,
          week.startDate,
          week.endDate
        );
        const vtWeek = vendasTotaisAlinhados(EMPTY_LV_ROWS, false, dmWeekFull);
        vendas = vtWeek.vendas;
        valorVendas = vtWeek.valorTotal;
        ticketMedio = vendas > 0 ? valorVendas / vendas : 0;
      }

      const weekInvestment = Number(weeklyInvestments[index]) || 0;
      const roas = weekInvestment > 0 ? valorVendas / weekInvestment : 0;

      const taxaLeadAgendamento = leadsCount > 0 ? agendamentos / leadsCount : 0;
      const taxaAgendamentoComparecimento =
        agendamentos > 0 ? comparecimentos / agendamentos : 0;
      const taxaComparecimentoVenda = comparecimentos > 0 ? vendas / comparecimentos : 0;
      const taxaLeadVenda = leadsCount > 0 ? vendas / leadsCount : 0;

      return {
        id: `${getYear(week.startDate)}-week-${index + 1}`,
        name: week.name,
        startDate: week.startDate,
        endDate: week.endDate,
        leads: leadsCount,
        agendamentos,
        comparecimentos,
        vendas,
        valorVendas,
        ticketMedio,
        roas: Number.isFinite(roas) ? roas : 0,
        taxaLeadAgendamento,
        taxaAgendamentoComparecimento,
        taxaComparecimentoVenda,
        taxaLeadVenda,
        weeklyInvestment: weekInvestment,
        leadsRaw: leadsInWeek,
      };
    });
  }, [
    weeks,
    filteredLeads,
    leadsPassingOrigemFilters,
    weeklyInvestments,
    agendamentoStatuses,
    comparecimentoStatuses,
    vendaStatuses,
    vRowsFilteredForOrigem,
    lvUsedTable,
    settings,
  ]);

  const monthlyMetrics = useMemo(() => {
    const totals = weeklyData.reduce(
      (acc, week) => {
        acc.totalLeads += week.leads;
        acc.agendamentos += week.agendamentos;
        acc.comparecimentos += week.comparecimentos;
        acc.investimento += week.weeklyInvestment;
        return acc;
      },
      { ...defaultMonthlyMetrics }
    );

    totals.vendas = periodVendasAlinhadas.vendas;
    totals.valorVendas = periodVendasAlinhadas.valorTotal;

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

    return totals;
  }, [weeklyData, periodVendasAlinhadas]);

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

    const periodYear = getYear(effectiveStart);
    const periodMonth = effectiveStart.getMonth() + 1;

    const payload = {
      user_id: user.id,
      year: periodYear,
      month: periodMonth,
      updated_at: new Date().toISOString(),
    };

    weeks.forEach((_, index) => {
      payload[`week${index + 1}_investment`] = Number(weeklyInvestments[index]) || 0;
    });

    setSavingInvestments(true);

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
      setSavingInvestments(false);
    }
  }, [user, effectiveStart, weeks, weeklyInvestments, toast]);

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
    investmentsLoading,
    savingInvestments,
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
