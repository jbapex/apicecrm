import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, parse } from 'date-fns';

const PAGE_SIZE = 50;

export const useLeadsData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchLeads = useCallback(async (searchTerm, filters, isNewSearch = false) => {
    if (!user) return;
    
    if (loading && !isNewSearch) return;

    setLoading(true);

    const currentPage = isNewSearch ? 0 : page;

    try {
      let query = supabase
        .from('leads')
        .select('*, product:product_id(id, name, code)', { count: 'exact' })
        .eq('user_id', user.id);

      if (filters.month && filters.month !== 'all') {
        const monthDate = parse(filters.month, 'yyyy-MM', new Date());
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);
        query = query
          .gte('data_entrada', startDate.toISOString().split('T')[0])
          .lte('data_entrada', endDate.toISOString().split('T')[0]);
      } else if (filters.dateRange?.from && filters.dateRange?.to) {
        query = query
          .gte('data_entrada', filters.dateRange.from.toISOString())
          .lte('data_entrada', filters.dateRange.to.toISOString());
      }
      
      if (searchTerm) {
        const searchParts = searchTerm.split(' ').map(part => part.trim()).filter(Boolean);
        const nameSearch = searchParts.map(part => `nome.ilike.%${part}%`).join(',');
        const orConditions = [nameSearch, `whatsapp.ilike.%${searchTerm}%`, `email.ilike.%${searchTerm}%`].join(',');
        query = query.or(orConditions);
      }

      if (filters.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }
      if (filters.vendedor && filters.vendedor !== 'todos') {
        query = query.eq('vendedor', filters.vendedor);
      }
      if (filters.product) {
        const { data: productData } = await supabase.from('products').select('id').ilike('name', `%${filters.product}%`).eq('user_id', user.id);
        const productIds = productData.map(p => p.id);
        if (productIds.length > 0) {
            query = query.in('product_id', productIds);
        } else {
            query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;
      
      setLeads(prev => isNewSearch ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE && (currentPage + 1) * PAGE_SIZE < count);
      setPage(currentPage + 1);

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
  }, [user, toast, page, loading]);

  const resetAndFetch = useCallback((searchTerm, filters) => {
    setPage(0);
    setHasMore(true);
    setLeads([]);
    fetchLeads(searchTerm, filters, true);
  }, [fetchLeads]);

  return { leads, setLeads, loading, fetchLeads, hasMore, resetAndFetch };
};