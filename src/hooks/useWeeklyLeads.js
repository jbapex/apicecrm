import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, parse } from 'date-fns';

export const useWeeklyLeads = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeadsForMonth = useCallback(async (monthFilter) => {
    if (!user) {
      setLeads([]);
      return;
    };
    
    setLoading(true);

    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      if (monthFilter && monthFilter !== 'all') {
        const monthDate = parse(monthFilter, 'yyyy-MM', new Date());
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);
        query = query
          .gte('data_entrada', startDate.toISOString().split('T')[0])
          .lte('data_entrada', endDate.toISOString().split('T')[0]);
      } else {
        // If no month is specified, maybe we should not fetch anything or fetch for the current month
        setLeads([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      setLeads(data || []);

    } catch (error) {
      toast({
        title: 'Erro ao buscar leads para análise',
        description: error.message,
        variant: 'destructive',
      });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return { leads, loading, fetchLeadsForMonth };
};