import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';
import {
  fetchLeadVendasInRange,
  fetchLeadsForVendasMetrics,
  dashboardMetricsFromLeads,
  vendasTotaisAlinhados,
} from '@/lib/vendasAggregation.js';

const useDashboardMetrics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSettings();
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
    vendasFunil: 0,
    noShow: 0,
    valorTotal: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
  });

  const fetchMetrics = useCallback(async () => {
    if (!user || settingsLoading) {
      if (user) setLoading(true);
      return;
    }
    setLoading(true);

    try {
      const comparecimentoStatuses = settings?.analytics_mappings?.comparecimento_statuses || [];
      const agendamentoStatuses = settings?.analytics_mappings?.agendamento_statuses || [];
      const noShowStatus = settings?.noshow_status;

      const { from: rangeFrom, to: rangeTo } = filters.dateRange;
      const allLeads = await fetchLeadsForVendasMetrics(supabase, user.id, rangeFrom, rangeTo);
      
      const dm = dashboardMetricsFromLeads(allLeads, settings, rangeFrom, rangeTo);
      const { rows: vRows, usedTable: vendasFromLeadVendasTable } = await fetchLeadVendasInRange(
        supabase,
        user.id,
        rangeFrom,
        rangeTo
      );

      const vt = vendasTotaisAlinhados(vRows, vendasFromLeadVendasTable, dm);
      let { vendas, vendasFunil, valorTotal } = vt;

      const { leadsInRangeByEntrada } = dm;
      const totalLeads = leadsInRangeByEntrada.length;
      let agendamentos = leadsInRangeByEntrada.filter(l => l.agendamento || (agendamentoStatuses.length > 0 && agendamentoStatuses.includes(l.status))).length;
      let comparecimentos = leadsInRangeByEntrada.filter(l => l.attended || (comparecimentoStatuses.length > 0 && comparecimentoStatuses.includes(l.status))).length;
      const noShow = noShowStatus ? leadsInRangeByEntrada.filter(l => l.status === noShowStatus).length : 0;

      if (vendasFromLeadVendasTable && vendas > 0) {
        comparecimentos = Math.max(comparecimentos, vendas);
        agendamentos = Math.max(agendamentos, comparecimentos);
      }

      setMetrics({
        totalLeads,
        agendamentos,
        comparecimentos,
        vendas,
        vendasFunil,
        noShow,
        valorTotal,
      });

      setRecentLeads(allLeads);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar métricas',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [user, filters.dateRange, toast, settings, settingsLoading]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, recentLeads, loading, filters, setFilters, refetch: fetchMetrics };
};

export default useDashboardMetrics;