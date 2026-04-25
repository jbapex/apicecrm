import { useState, useCallback } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchLeadsForVendasMetrics,
  fetchLeadVendasInRange,
  mergeLeadsForLeadVendaRows,
} from '@/lib/vendasAggregation.js';

const emptyBundle = { rows: [], usedTable: false };

export const useWeeklyLeads = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payload, setPayload] = useState({
    leads: [],
    leadVendasBundle: emptyBundle,
    loading: true,
  });

  const leads = payload.leads;
  const loading = payload.loading;
  const leadVendasBundle = payload.leadVendasBundle;

  const fetchLeadsForRange = useCallback(
    async (dateRange) => {
      if (!user) {
        setPayload({ leads: [], leadVendasBundle: emptyBundle, loading: false });
        return;
      }

      // Se não houver intervalo válido, não busca nada
      if (!dateRange?.from || !dateRange?.to) {
        setPayload({ leads: [], leadVendasBundle: emptyBundle, loading: false });
        return;
      }

      setPayload((p) => ({ ...p, loading: true }));

      try {
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to);
        const data = await fetchLeadsForVendasMetrics(supabase, user.id, from, to);
        const lv = await fetchLeadVendasInRange(supabase, user.id, from, to);
        const vRows = lv.rows || [];
        const bundle = { rows: vRows, usedTable: Boolean(lv.usedTable) };
        const merged = await mergeLeadsForLeadVendaRows(supabase, user.id, data || [], vRows);
        setPayload({
          leads: merged || [],
          leadVendasBundle: bundle,
          loading: false,
        });
      } catch (error) {
        toast({
          title: 'Erro ao buscar leads para análise',
          description: error.message,
          variant: 'destructive',
        });
        setPayload({ leads: [], leadVendasBundle: emptyBundle, loading: false });
      }
    },
    [user, toast]
  );

  return { leads, loading, fetchLeadsForRange, leadVendasBundle };
};