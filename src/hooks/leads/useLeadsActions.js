import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { normalizePhoneNumber, getPhoneVariations } from '@/lib/leadUtils.js';
import { syncLeadVendaFromLead } from '@/lib/syncLeadVenda.js';

export const useLeadsActions = (setLeads, refetchLeads, settings) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const checkForDuplicate = async (whatsapp) => {
    if (!user || !whatsapp) return null;
    const formattedWhatsapp = normalizePhoneNumber(whatsapp);
    if (!formattedWhatsapp) return null;

    const phoneVariations = getPhoneVariations(formattedWhatsapp);

    const { data: existingLeads, error: fetchError } = await supabase
      .from('leads')
      .select('*, product:product_id(id, name, code)')
      .eq('user_id', user.id)
      .in('whatsapp', phoneVariations)
      .limit(1);

    if (fetchError) {
      toast({ variant: "destructive", title: "Erro ao verificar duplicidade", description: fetchError.message });
      return null;
    }
    
    return existingLeads?.[0] || null;
  };

  const createNewLead = async (leadData, showToast = true) => {
    if (!user) return null;
    const formattedWhatsapp = normalizePhoneNumber(leadData.whatsapp);
    const newLeadData = { ...leadData, whatsapp: formattedWhatsapp, user_id: user.id, data_entrada: leadData.data_entrada || new Date().toISOString().split('T')[0], valor: leadData.valor || 0, updated_at: new Date().toISOString(), profile_pic_url: leadData.profile_pic_url || null };
    
    const { data, error } = await supabase.from('leads').insert([newLeadData]).select('*, product:product_id(id, name, code)').single();

    if (error) {
      if(showToast) toast({ variant: "destructive", title: "Erro ao adicionar lead", description: error.message });
      return null;
    }
    const sync = await syncLeadVendaFromLead(supabase, user.id, data, settings);
    refetchLeads();
    if (showToast) {
      if (!sync.ok && !sync.skipped) {
        toast({
          title: 'Lead adicionado',
          description: 'Cadastro ok, mas a tabela de vendas não atualizou. Verifique o Supabase ou tente editar de novo.',
        });
      } else {
        toast({ title: 'Lead adicionado!', description: 'Novo lead cadastrado com sucesso.' });
      }
    }
    return data;
  };

  const updateExistingLead = async (existingLead, leadData, showToast = true) => {
    if (!user) return null;
    const formattedWhatsapp = normalizePhoneNumber(leadData.whatsapp);
    const updatedData = { ...existingLead, ...leadData, whatsapp: formattedWhatsapp, nome: leadData.nome || existingLead.nome, updated_at: new Date().toISOString() };
    delete updatedData.id;
    delete updatedData.product;

    const { data: updatedLead, error: updateError } = await supabase.from('leads').update(updatedData).eq('id', existingLead.id).select('*, product:product_id(id, name, code)').single();

    if (updateError) {
        if(showToast) toast({ variant: "destructive", title: "Erro ao atualizar lead", description: updateError.message });
        return null;
    }
    const sync = await syncLeadVendaFromLead(supabase, user.id, updatedLead, settings);
    refetchLeads();
    if (showToast) {
      if (!sync.ok && !sync.skipped) {
        toast({
          title: 'Lead atualizado',
          description: 'Alterações salvas, mas a tabela de vendas não sincronizou.',
        });
      } else {
        toast({ title: 'Lead atualizado!', description: 'O lead já existia e foi atualizado.' });
      }
    }
    return updatedLead;
  };

  const handleAddLead = async (leadData, showToast = true) => {
    const existingLead = await checkForDuplicate(leadData.whatsapp);
    if (existingLead) {
      return { duplicate: true, existingLead };
    }
    const newLead = await createNewLead(leadData, showToast);
    return { duplicate: false, newLead };
  };
  
  const handleUpdateLead = async (id, updatedFields) => {
      const { data, error } = await supabase.from('leads').update(updatedFields).eq('id', id).select('*, product:product_id(id, name, code)').single();
      if (error) {
          toast({ variant: "destructive", title: 'Erro ao Atualizar', description: error.message });
          return { data: null, error };
      }
      if (user) {
        const sync = await syncLeadVendaFromLead(supabase, user.id, data, settings);
        if (!sync.ok && !sync.skipped) {
          toast({
            title: 'Lead atualizado',
            description: 'Informações salvas; tabela de vendas não sincronizou.',
          });
        } else {
          toast({ title: 'Lead Atualizado!', description: 'As informações do lead foram salvas.' });
        }
      } else {
        toast({ title: 'Lead Atualizado!', description: 'As informações do lead foram salvas.' });
      }
      setLeads(prevLeads => prevLeads.map(lead => (lead.id === id ? data : lead)));
      return { data, error: null };
  };

  const handleDeleteLead = async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      toast({ variant: "destructive", title: 'Erro ao Excluir', description: error.message });
    } else {
      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast({ title: 'Lead Excluído!', description: 'O lead foi removido com sucesso.' });
    }
  };

  const handleBulkAddLeads = async (leadsData) => {
      if (!user) return { success: false, createdCount: 0, createdLeads: [] };

      const leadsToInsert = [];
      for (const lead of leadsData) {
          const existing = await checkForDuplicate(lead.whatsapp);
          if (!existing) {
              leadsToInsert.push({ ...lead, user_id: user.id, data_entrada: lead.data_entrada || new Date().toISOString().split('T')[0] });
          }
      }

      if (leadsToInsert.length === 0) {
          toast({ title: "Nenhum lead novo para adicionar", description: "Todos os leads da lista já existem.", variant: "default" });
          return { success: true, createdCount: 0, createdLeads: [] };
      }

      const { data: createdLeads, error } = await supabase.from('leads').insert(leadsToInsert).select();
      if (error) {
          toast({ variant: "destructive", title: "Erro na importação em massa", description: error.message });
          return { success: false, createdCount: 0, createdLeads: [] };
      }
      for (const row of createdLeads || []) {
        await syncLeadVendaFromLead(supabase, user.id, row, settings);
      }
      toast({ title: "Sucesso!", description: `${createdLeads.length} leads foram importados. ${leadsData.length - createdLeads.length} já existiam.` });
      refetchLeads();
      return { success: true, createdCount: createdLeads.length, createdLeads };
  };

  const handleBulkDeleteLeads = async (leadIds) => {
    const { error } = await supabase.from('leads').delete().in('id', leadIds);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir leads', description: error.message });
    } else {
      setLeads(prev => prev.filter(lead => !leadIds.includes(lead.id)));
      toast({ title: 'Leads excluídos', description: `${leadIds.length} leads foram removidos.` });
    }
  };

  return { handleAddLead, updateExistingLead, handleUpdateLead, handleDeleteLead, handleBulkAddLeads, handleBulkDeleteLeads };
};