import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { startOfMonth, endOfMonth, subMonths, parseISO, startOfDay, endOfDay } from 'date-fns';
import {
  fetchLeadVendasInRange,
  fetchLeadsForVendasMetrics,
  dashboardMetricsFromLeads,
  vendasTotaisAlinhados,
  toDateOnlyString,
} from '@/lib/vendasAggregation.js';

const useReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSettings();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    period: 'current_month',
    customRange: { from: null, to: null },
  });

  const getPeriodRange = (period, customRange) => {
    const now = new Date();
    switch (period) {
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        return {
          start: toDateOnlyString(startOfMonth(lastMonth)),
          end: toDateOnlyString(endOfMonth(lastMonth)),
        };
      }
      case 'custom':
        return {
          start: customRange.from ? toDateOnlyString(customRange.from) : null,
          end: customRange.to ? toDateOnlyString(customRange.to) : null,
        };
      case 'current_month':
      default:
        return {
          start: toDateOnlyString(startOfMonth(now)),
          end: toDateOnlyString(endOfMonth(now)),
        };
    }
  };

  const fetchReportData = useCallback(async () => {
    if (!user || settingsLoading) {
      if (user) setLoading(true);
      return;
    }
    setLoading(true);

    const { start, end } = getPeriodRange(filters.period, filters.customRange);
    
    if (!start || !end) {
        setReportData(null);
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase.rpc('get_performance_report', {
        start_date: start,
        end_date: end,
      });

      if (error) throw error;

      let merged = data;
      const rangeFrom = startOfDay(parseISO(`${start}T12:00:00`));
      const rangeTo = endOfDay(parseISO(`${end}T12:00:00`));

      const [allLeads, { rows: vRows, usedTable }] = await Promise.all([
        fetchLeadsForVendasMetrics(supabase, user.id, rangeFrom, rangeTo),
        fetchLeadVendasInRange(supabase, user.id, rangeFrom, rangeTo),
      ]);
      const dm = dashboardMetricsFromLeads(allLeads, settings, rangeFrom, rangeTo);
      const vt = vendasTotaisAlinhados(vRows, usedTable, dm);

      if (merged && typeof merged === 'object') {
        const f =
          merged.funil_de_vendas && typeof merged.funil_de_vendas === 'object'
            ? { ...merged.funil_de_vendas }
            : { total: 0, agendados: 0, compareceram: 0, venderam: 0 };
        const venderam = vt.vendas;
        const compareceram = Math.max(Number(f.compareceram) || 0, venderam);
        const agendados = Math.max(Number(f.agendados) || 0, compareceram);
        merged = {
          ...merged,
          total_valor_vendas: vt.valorTotal,
          total_vendas: vt.vendas,
          funil_de_vendas: {
            ...f,
            agendados,
            compareceram,
            venderam,
          },
        };
      }

      setReportData(merged);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: 'Erro ao buscar dados do relatório',
        description: error.message,
        variant: 'destructive',
      });
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [user, filters, toast, settings, settingsLoading]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return { loading, reportData, filters, setFilters, refetch: fetchReportData };
};

export default useReports;