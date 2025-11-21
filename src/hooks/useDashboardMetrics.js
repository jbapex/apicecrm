import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, subDays, isValid, parseISO } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';

const useDashboardMetrics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSettings();
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    agendamentos: 0,
    comparecimentos: 0,
    vendas: 0,
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
      let vendaStatuses = settings?.analytics_mappings?.venda_statuses || [];
      if (!vendaStatuses.includes('vendeu')) {
          vendaStatuses.push('vendeu');
      }
      
      const comparecimentoStatuses = settings?.analytics_mappings?.comparecimento_statuses || [];
      const agendamentoStatuses = settings?.analytics_mappings?.agendamento_statuses || [];
      const noShowStatus = settings?.noshow_status;

      let query = supabase
        .from('leads')
        .select('id, data_entrada, custom_date_field, agendamento, status, valor, nome, created_at, attended, origem')
        .eq('user_id', user.id);

      if (filters.dateRange?.from && filters.dateRange?.to) {
        const broaderFrom = subDays(filters.dateRange.from, 30).toISOString();
        query = query.or(`data_entrada.gte.${broaderFrom},custom_date_field.gte.${broaderFrom}`);
      }

      const { data: allLeads, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      const leadsInRange = allLeads.filter(lead => {
          const effectiveDateStr = lead.custom_date_field || lead.data_entrada;
          if (!effectiveDateStr) return false;
          
          const effectiveDate = parseISO(effectiveDateStr);
          if (!isValid(effectiveDate)) return false;

          return effectiveDate >= filters.dateRange.from && effectiveDate <= filters.dateRange.to;
      });

      const totalLeads = leadsInRange.length;
      const agendamentos = leadsInRange.filter(l => l.agendamento || (agendamentoStatuses.length > 0 && agendamentoStatuses.includes(l.status))).length;
      const comparecimentos = leadsInRange.filter(l => l.attended || (comparecimentoStatuses.length > 0 && comparecimentoStatuses.includes(l.status))).length;
      const vendas = leadsInRange.filter(l => vendaStatuses.includes(l.status)).length;
      const noShow = noShowStatus ? leadsInRange.filter(l => l.status === noShowStatus).length : 0;
      
      const valorTotal = leadsInRange
        .filter(l => vendaStatuses.includes(l.status))
        .reduce((sum, lead) => sum + (Number(lead.valor) || 0), 0);

      setMetrics({
        totalLeads,
        agendamentos,
        comparecimentos,
        vendas,
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