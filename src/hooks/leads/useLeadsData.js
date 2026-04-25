import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';
import { sumVendasMetrics } from '@/lib/vendaMetrics.js';
import { fetchLeadVendasForListTotals, sumValorFromLeadVendaRows } from '@/lib/vendasAggregation.js';

const PAGE_SIZE = 50;
const BULK_PAGE = 1000;

/** Aplica os mesmos filtros da lista de leads (exceto range/paginação). */
async function applyLeadListFilters(query, { searchTerm, filters, settings, supabaseClient, userId }) {
  let q = query.eq('user_id', userId);

  const dateField =
    filters.monthMode === 'venda' ? 'custom_date_field' : 'data_entrada';

  if ((filters.year && filters.year !== 'all') || (filters.month && filters.month !== 'all')) {
    const now = new Date();
    const year = filters.year && filters.year !== 'all' ? Number(filters.year) : now.getFullYear();

    let startDate;
    let endDate;

    if (filters.month && filters.month !== 'all') {
      const monthIndex = Number(filters.month) - 1;
      const baseDate = new Date(year, monthIndex, 1);
      startDate = startOfMonth(baseDate);
      endDate = endOfMonth(baseDate);
    } else {
      startDate = startOfYear(new Date(year, 0, 1));
      endDate = endOfYear(new Date(year, 0, 1));
    }

    q = q
      .gte(dateField, startDate.toISOString().split('T')[0])
      .lte(dateField, endDate.toISOString().split('T')[0]);
  } else if (filters.dateRange?.from && filters.dateRange?.to) {
    q = q
      .gte(dateField, filters.dateRange.from.toISOString())
      .lte(dateField, filters.dateRange.to.toISOString());
  }

  if (searchTerm) {
    const searchParts = searchTerm.split(' ').map((part) => part.trim()).filter(Boolean);
    const nameSearch = searchParts.map((part) => `nome.ilike.%${part}%`).join(',');
    const orConditions = [nameSearch, `whatsapp.ilike.%${searchTerm}%`, `email.ilike.%${searchTerm}%`].join(',');
    q = q.or(orConditions);
  }

  if (filters.status && filters.status !== 'todos') {
    if (filters.status === 'vendas_agrupadas') {
      let vendaStatuses = settings?.analytics_mappings?.venda_statuses || [];
      if (!vendaStatuses.includes('vendeu')) {
        vendaStatuses = [...vendaStatuses, 'vendeu'];
      }
      if (vendaStatuses.length > 0) {
        q = q.in('status', vendaStatuses);
      }
    } else {
      q = q.eq('status', filters.status);
    }
  }
  if (filters.vendedor && filters.vendedor !== 'todos') {
    q = q.eq('vendedor', filters.vendedor);
  }
  if (filters.product) {
    const { data: productData } = await supabaseClient
      .from('products')
      .select('id')
      .ilike('name', `%${filters.product}%`)
      .eq('user_id', userId);
    const productIds = (productData || []).map((p) => p.id);
    if (productIds.length > 0) {
      q = q.in('product_id', productIds);
    } else {
      q = q.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  // Não retornar `q` direto de função async: PostgrestFilterBuilder é thenable e o
  // runtime resolve a Promise com o *resultado* da query, não com o builder (→ ".range is not a function").
  return { builder: q };
}

export const useLeadsData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [vendasTotals, setVendasTotals] = useState({ totalVendas: 0, ticketMedio: 0 });
  const [vendasTotalsLoading, setVendasTotalsLoading] = useState(false);

  const fetchVendasTotalsForFilters = useCallback(
    async (searchTerm, filters) => {
      if (!user) return;
      setVendasTotalsLoading(true);
      try {
        let productIds = null;
        if (filters.product) {
          const { data: productData } = await supabase
            .from('products')
            .select('id')
            .ilike('name', `%${filters.product}%`)
            .eq('user_id', user.id);
          productIds = (productData || []).map((p) => p.id);
        }

        const { usedTable, rows: vRows } = await fetchLeadVendasForListTotals(
          supabase,
          user.id,
          filters,
          settings,
          searchTerm,
          filters.product ? productIds : null
        );

        if (usedTable) {
          const { totalVendas, ticketMedio } = sumValorFromLeadVendaRows(vRows);
          setVendasTotals({ totalVendas, ticketMedio });
          return;
        }

        const allRows = [];
        let offset = 0;
        for (;;) {
          const { builder: pageQuery } = await applyLeadListFilters(
            supabase.from('leads').select('valor, status, custom_date_field'),
            { searchTerm, filters, settings, supabaseClient: supabase, userId: user.id }
          );
          const { data, error } = await pageQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + BULK_PAGE - 1);
          if (error) throw error;
          if (!data?.length) break;
          allRows.push(...data);
          if (data.length < BULK_PAGE) break;
          offset += BULK_PAGE;
        }

        const { totalVendas, ticketMedio } = sumVendasMetrics(allRows, settings);
        setVendasTotals({ totalVendas, ticketMedio });
      } catch (error) {
        console.error(error);
        setVendasTotals({ totalVendas: 0, ticketMedio: 0 });
      } finally {
        setVendasTotalsLoading(false);
      }
    },
    [user, settings]
  );

  const fetchLeads = useCallback(
    async (searchTerm, filters, isNewSearch = false) => {
      if (!user) return;

      if (loading && !isNewSearch) return;

      setLoading(true);

      const currentPage = isNewSearch ? 0 : page;

      try {
        const isKanban = filters.mode === 'kanban';
        const { builder: query } = await applyLeadListFilters(
          supabase.from('leads').select('*, product:product_id(id, name, code)', { count: 'exact' }),
          { searchTerm, filters, settings, supabaseClient: supabase, userId: user.id }
        );

        let from = currentPage * PAGE_SIZE;
        let to = from + PAGE_SIZE - 1;

        if (isKanban) {
          from = 0;
          to = 9999;
        }

        const ordered = query.order('created_at', { ascending: false }).range(from, to);

        const { data, error, count } = await ordered;

        if (error) throw error;

        if (isKanban) {
          setLeads(data || []);
          setHasMore(false);
          setPage(0);
        } else {
          setLeads((prev) => (isNewSearch ? data : [...prev, ...data]));
          setHasMore(data.length === PAGE_SIZE && (currentPage + 1) * PAGE_SIZE < count);
          setPage(currentPage + 1);
        }
      } catch (error) {
        toast({
          title: 'Erro ao buscar leads',
          description: error.message,
          variant: 'destructive',
        });
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [user, toast, page, loading, settings]
  );

  const resetAndFetch = useCallback(
    (searchTerm, filters) => {
      setPage(0);
      setHasMore(true);
      setLeads([]);
      fetchVendasTotalsForFilters(searchTerm, filters);
      fetchLeads(searchTerm, filters, true);
    },
    [fetchLeads, fetchVendasTotalsForFilters]
  );

  return {
    leads,
    setLeads,
    loading,
    fetchLeads,
    hasMore,
    resetAndFetch,
    vendasTotals,
    vendasTotalsLoading,
  };
};
