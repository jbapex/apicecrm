import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';

export const useProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao buscar produtos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (productData) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...productData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      setProducts((prev) => [...prev, data]);
      toast({ title: 'Sucesso!', description: 'Produto adicionado.' });
      return data;
    } catch (error) {
      toast({ title: 'Erro ao adicionar produto', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
      toast({ title: 'Sucesso!', description: 'Produto atualizado.' });
      return data;
    } catch (error) {
      toast({ title: 'Erro ao atualizar produto', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Sucesso!', description: 'Produto excluído.' });
      return true;
    } catch (error) {
      toast({ title: 'Erro ao excluir produto', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  return { products, loading, addProduct, updateProduct, deleteProduct };
};