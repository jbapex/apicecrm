import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, subMonths, formatISO } from 'date-fns';

const useReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    period: 'current_month',
    customRange: { from: null, to: null },
  });

  const getPeriodRange = (period, customRange) => {
    const now = new Date();
    switch (period) {
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return {
          start: formatISO(startOfMonth(lastMonth), { representation: 'date' }),
          end: formatISO(endOfMonth(lastMonth), { representation: 'date' }),
        };
      case 'custom':
        return {
          start: customRange.from ? formatISO(customRange.from, { representation: 'date' }) : null,
          end: customRange.to ? formatISO(customRange.to, { representation: 'date' }) : null,
        };
      case 'current_month':
      default:
        return {
          start: formatISO(startOfMonth(now), { representation: 'date' }),
          end: formatISO(endOfMonth(now), { representation: 'date' }),
        };
    }
  };

  const fetchReportData = useCallback(async () => {
    if (!user) return;
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
      setReportData(data);
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
  }, [user, filters, toast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return { loading, reportData, filters, setFilters, refetch: fetchReportData };
};

export default useReports;