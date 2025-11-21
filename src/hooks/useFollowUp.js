import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { add, subDays, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

const calculateDueDate = (lead, task) => {
  if (!task) return null;
  if (task.due_date_type === 'relative_to_schedule' && lead.agendamento) {
    return subDays(new Date(lead.agendamento), task.due_days);
  }
  if (task.due_date_type === 'relative_to_assignment' && lead.task_assigned_at) {
    return add(new Date(lead.task_assigned_at), { days: task.due_days });
  }
  return null;
};

export const useFollowUp = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [leads, setLeads] = useState([]);
  const [viewMode, setViewMode] = useState('leads'); // 'leads' or 'tasks'
  const [filters, setFilters] = useState({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    status: 'todos',
    searchTerm: '',
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalType, setModalType] = useState('');
  const [activeFlowsByLead, setActiveFlowsByLead] = useState(new Map());
  const [isChangingFlow, setIsChangingFlow] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowUpData = useCallback(async (currentFilters) => {
    if (!user) return;
    setLoading(true);

    try {
      const { from, to } = currentFilters.dateRange || {};
      
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      if (from && to) {
        query = query
          .gte('data_entrada', from.toISOString())
          .lte('data_entrada', to.toISOString());
      }

      if (currentFilters.status && currentFilters.status !== 'todos') {
        query = query.eq('status', currentFilters.status);
      }

      if (currentFilters.searchTerm) {
        const searchTerm = `%${currentFilters.searchTerm.replace(/\s/g, '%')}%`;
        query = query.or(`nome.ilike.${searchTerm},whatsapp.ilike.${searchTerm}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar dados de follow-up', description: error.message });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchFollowUpData(filters);
  }, [filters, fetchFollowUpData]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('follow_up_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      setTasks(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar tarefas', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchActiveFlows = useCallback(async (leadIds) => {
    if (!user || leadIds.length === 0) return;
    try {
      const { data, error } = await supabase.rpc('get_active_flows_for_leads', {
        p_lead_ids: leadIds
      });

      if (error) throw error;

      setActiveFlowsByLead(prevMap => {
        const newMap = new Map();
        data.forEach(instance => {
          newMap.set(instance.lead_id, { id: instance.id, status: instance.status });
        });
        return newMap;
      });
    } catch (error) {
      console.error("Error fetching active flows", error);
      toast({ variant: 'destructive', title: 'Erro ao verificar fluxos', description: error.message });
    }
  }, [user, toast]);

  useEffect(() => {
    if (leads.length > 0) {
      fetchActiveFlows(leads.map(l => l.id));
    }
  }, [leads, fetchActiveFlows]);
  
  const handleUpdateLeadLocally = (leadId, updates) => {
    setLeads(currentLeads => 
      currentLeads.map(lead => 
        lead.id === leadId ? { ...lead, ...updates } : lead
      )
    );
  };

  useEffect(() => {
    if (!user) return;
    const flowInstanceChanges = supabase.channel('public:flow_instances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flow_instances' },
      (payload) => {
        const leadId = payload.new?.lead_id || payload.old?.lead_id;
        if (leadId) fetchActiveFlows([leadId]);
      }).subscribe();
    const leadChanges = supabase.channel('public:leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` }, 
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          handleUpdateLeadLocally(payload.new.id, payload.new);
        } else if (payload.eventType === 'INSERT') {
          setLeads(current => [payload.new, ...current]);
        } else if (payload.eventType === 'DELETE') {
          setLeads(current => current.filter(l => l.id !== payload.old.id));
        }
        if (payload.new && payload.new.id) setTimeout(() => fetchActiveFlows([payload.new.id]), 1000);
      }).subscribe();
    return () => {
      supabase.removeChannel(flowInstanceChanges);
      supabase.removeChannel(leadChanges);
    };
  }, [user, fetchActiveFlows]);

  const openModal = useCallback((lead, type) => {
    setSelectedLead(lead);
    setModalType(type);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedLead(null);
    setModalType('');
    setIsChangingFlow(false);
  }, []);

  const handleStartFlowManual = async (leadId, flowId) => {
    if (!user || !leadId || !flowId) {
      toast({ variant: "destructive", title: "Erro de autenticação ou dados faltando." });
      return;
    }
  
    try {
      const { data: leadData, error: leadError } = await supabase.from('leads').select('id, nome, whatsapp, email, status, tags, origem').eq('id', leadId).single();
      if (leadError || !leadData) throw new Error(leadError?.message || 'Lead não encontrado.');

      const { data: flowData, error: flowError } = await supabase.from('follow_up_flows').select('nodes').eq('id', flowId).single();
      if (flowError || !flowData) throw new Error(flowError?.message || 'Fluxo não encontrado.');
  
      const startNode = flowData.nodes.find(node => node.type === 'start');
      if (!startNode) throw new Error('O fluxo não possui um nó de início.');
  
      const leadDetailsState = {
        lead_details: { id: leadData.id, nome: leadData.nome, whatsapp: leadData.whatsapp, email: leadData.email, status: leadData.status, tags: leadData.tags, origem: leadData.origem }
      };

      const { data: newInstance, error: insertError } = await supabase.from('flow_instances').insert({
        flow_id: flowId, lead_id: leadId, status: 'running', current_node_id: startNode.id, state: leadDetailsState, started_at: new Date().toISOString(), updated_at: new Date().toISOString(), next_execution_time: new Date().toISOString(),
      }).select().single();
  
      if (insertError) {
        if (insertError.code === '23505') toast({ variant: "destructive", title: "Fluxo já iniciado", description: "Este lead já está em uma instância deste fluxo." });
        else throw insertError;
      } else {
        toast({ title: "Fluxo iniciado!", description: "O fluxo foi acionado manualmente para o lead." });
        setActiveFlowsByLead(prev => new Map(prev).set(leadId, { id: newInstance.id, status: 'running' }));
      }
    } catch (error) {
      console.error('Error starting flow manually:', error);
      toast({ variant: "destructive", title: "Erro ao iniciar fluxo", description: error.message });
    }
  };

  const flowActions = async (action, lead, flowId = null) => {
    const instance = activeFlowsByLead.get(lead.id);
    const instanceId = instance?.id;

    try {
      let result;
      let successMessage = '';
      switch (action) {
        case 'start': openModal(lead, 'start_flow'); return;
        case 'pause':
          if (!instanceId) throw new Error("Instância do fluxo não encontrada.");
          result = await supabase.from('flow_instances').update({ status: 'paused' }).eq('id', instanceId).select().single();
          successMessage = 'Fluxo pausado com sucesso.';
          break;
        case 'resume':
          if (!instanceId) throw new Error("Instância do fluxo não encontrada.");
          result = await supabase.from('flow_instances').update({ status: 'running', next_execution_time: new Date().toISOString() }).eq('id', instanceId).select().single();
          successMessage = 'Fluxo retomado com sucesso.';
          break;
        case 'reset':
          if (!instanceId) throw new Error("Instância do fluxo não encontrada.");
          result = await supabase.from('flow_instances').delete().eq('id', instanceId);
          successMessage = 'Fluxo resetado com sucesso.';
          break;
        case 'change':
          if (instanceId) await supabase.from('flow_instances').delete().eq('id', instanceId);
          setIsChangingFlow(true);
          openModal(lead, 'start_flow');
          return;
        default: throw new Error("Ação desconhecida.");
      }
      if (result.error) throw result.error;
      toast({ title: 'Sucesso!', description: successMessage });
      fetchActiveFlows([lead.id]);
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      toast({ variant: "destructive", title: `Erro ao ${action} fluxo`, description: error.message });
    }
  };

  const displayedLeads = useMemo(() => {
    if (viewMode === 'tasks') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return leads
            .filter(lead => lead.task_id && tasks.find(t => t.id === lead.task_id))
            .map(lead => ({ ...lead, dueDate: calculateDueDate(lead, tasks.find(t => t.id === lead.task_id))}))
            .filter(lead => lead.dueDate)
            .sort((a, b) => differenceInDays(a.dueDate, now) - differenceInDays(b.dueDate, now));
    }

    return leads;
  }, [leads, viewMode, tasks]);

  return {
    viewMode,
    setViewMode,
    filters,
    setFilters,
    tasks,
    fetchTasks,
    displayedLeads,
    loading,
    handleUpdateLeadLocally,
    activeFlowsByLead,
    modalType,
    selectedLead,
    isChangingFlow,
    flowActions,
    handleStartFlowManual,
    openModal,
    closeModal,
  };
};