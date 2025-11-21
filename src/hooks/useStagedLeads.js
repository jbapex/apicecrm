import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext.jsx';
import { normalizePhoneNumber } from '@/lib/leadUtils.js';

export function useStagedLeads() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { settings, loading: settingsLoading } = useSettings();

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [updatingLeadId, setUpdatingLeadId] = useState(null);
    const [confirmationDialog, setConfirmationDialog] = useState({ action: null, leadIds: [] });
    const [conversationModal, setConversationModal] = useState({ isOpen: false, whatsappNumber: null });
    const [saveTimeout, setSaveTimeout] = useState(null);

    const fetchStagedLeads = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data: stagedLeadsData, error: stagedLeadsError } = await supabase
                .from('staged_leads')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['new', 'updated'])
                .order('data_recebimento', { ascending: false });

            if (stagedLeadsError) throw stagedLeadsError;

            const { data: mainLeadsData, error: mainLeadsError } = await supabase
                .from('leads')
                .select('whatsapp')
                .eq('user_id', user.id);

            if (mainLeadsError) throw mainLeadsError;

            const mainLeadsPhones = new Set(mainLeadsData.map(l => normalizePhoneNumber(l.whatsapp)));
            
            const uniqueStagedLeads = [];
            const seenPhones = new Set();

            for (const lead of stagedLeadsData) {
                const normalizedPhone = normalizePhoneNumber(lead.whatsapp);
                if (!mainLeadsPhones.has(normalizedPhone) && !seenPhones.has(normalizedPhone)) {
                    uniqueStagedLeads.push(lead);
                    seenPhones.add(normalizedPhone);
                }
            }
            
            setLeads(uniqueStagedLeads);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao buscar leads",
                description: "Não foi possível carregar os leads da caixa de entrada. Tente novamente.",
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchStagedLeads();

        const channel = supabase.channel('staged_leads_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staged_leads', filter: `user_id=eq.${user?.id}` },
                (payload) => {
                    fetchStagedLeads();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (saveTimeout) clearTimeout(saveTimeout);
        };
    }, [fetchStagedLeads, user?.id]);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = (
                (lead.nome && lead.nome.toLowerCase().includes(searchTermLower)) ||
                (lead.whatsapp && lead.whatsapp.toLowerCase().includes(searchTermLower))
            );

            const matchesDate = !dateRange || (
                new Date(lead.data_recebimento) >= new Date(dateRange.from).setHours(0, 0, 0, 0) &&
                new Date(lead.data_recebimento) <= new Date(dateRange.to).setHours(23, 59, 59, 999)
            );
            
            return matchesSearch && matchesDate;
        });
    }, [leads, searchTerm, dateRange]);


    const handleSelectLead = (id, checked) => {
        setSelectedLeads(prev =>
            checked ? [...prev, id] : prev.filter(leadId => leadId !== id)
        );
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedLeads(filteredLeads.map(lead => lead.id));
        } else {
            setSelectedLeads([]);
        }
    };
    
    const autoSaveLead = useCallback(async (leadToSave) => {
        setUpdatingLeadId(leadToSave.id);
        
        const updates = {
            observacoes: leadToSave.observacoes,
            lead_status: leadToSave.lead_status,
            agendamento: leadToSave.agendamento,
            origem: leadToSave.origem,
            sub_origem: leadToSave.sub_origem,
            valor: leadToSave.valor,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('staged_leads')
            .update(updates)
            .eq('id', leadToSave.id);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar as alterações. Tente novamente.'
            });
        }
        setUpdatingLeadId(null);
    }, [toast]);

    const handleUpdateLeadField = useCallback((id, field, value) => {
        let updatedLead = null;
        setLeads(prevLeads => {
            const newLeads = prevLeads.map(lead => {
                if (lead.id === id) {
                    updatedLead = { ...lead, [field]: value };
                    return updatedLead;
                }
                return lead;
            });
            return newLeads;
        });
        
        if (saveTimeout) clearTimeout(saveTimeout);

        if (updatedLead) {
          const newTimeout = setTimeout(() => {
              autoSaveLead(updatedLead);
          }, 800);
          setSaveTimeout(newTimeout);
        }
    }, [saveTimeout, autoSaveLead]);

    
    const importLeads = useCallback(async (leadIds) => {
        const leadsToImport = leads.filter(l => leadIds.includes(l.id));
        const invalidLeads = leadsToImport.filter(l => !l.lead_status || !l.origem);
    
        if (invalidLeads.length > 0) {
            toast({
                variant: "destructive",
                title: "Campos obrigatórios ausentes",
                description: `Os leads: ${invalidLeads.map(l => l.nome).join(', ')} precisam de Status e Fonte de Origem.`,
            });
            return;
        }

        let allSucceeded = true;

        for (const lead of leadsToImport) {
            const { error } = await supabase.rpc('import_staged_lead', { p_staged_lead_id: lead.id });
            
            if (error) {
                toast({
                    variant: "destructive",
                    title: `Erro ao importar "${lead.nome}"`,
                    description: error.message,
                });
                allSucceeded = false;
            }
        }
        
        if (allSucceeded && leadIds.length > 0) {
            toast({
                title: "Leads Importados!",
                description: `${leadIds.length} lead(s) foram importados para sua base principal.`,
            });
        } else if (!allSucceeded) {
             toast({
                variant: "default",
                title: "Importação Parcial",
                description: "Alguns leads não puderam ser importados. Verifique os avisos.",
            });
        }

        fetchStagedLeads();
        setSelectedLeads([]);

    }, [leads, toast, fetchStagedLeads]);
    
    const deleteLeads = useCallback(async (leadIds) => {
        const { error } = await supabase
            .from('staged_leads')
            .delete()
            .in('id', leadIds);

        if (error) {
            toast({
                variant: "destructive",
                title: "Erro ao ignorar leads",
                description: "Não foi possível ignorar os leads selecionados. Tente novamente.",
            });
        } else {
            toast({
                title: "Leads Ignorados",
                description: `${leadIds.length} lead(s) foram ignorados com sucesso.`,
            });
            fetchStagedLeads();
            setSelectedLeads([]);
        }
    }, [toast, fetchStagedLeads]);

    const confirmAction = () => {
        if (!confirmationDialog.action) return;

        if (confirmationDialog.action === 'import') {
            importLeads(confirmationDialog.leadIds);
        } else if (confirmationDialog.action === 'delete') {
            deleteLeads(confirmationDialog.leadIds);
        }

        setConfirmationDialog({ action: null, leadIds: [] });
    };

    return {
        leads: filteredLeads,
        loading: loading || settingsLoading,
        searchTerm,
        setSearchTerm,
        setDateRange,
        selectedLeads,
        setSelectedLeads,
        updatingLeadId,
        stagedLeadsCount: leads.length,
        handleSelectLead,
        handleSelectAll,
        handleUpdateLeadField,
        handleImportLead: (id) => importLeads([id]),
        handleDeleteLead: (id) => deleteLeads([id]),
        handleBulkImport: () => importLeads(selectedLeads),
        handleBulkDelete: () => deleteLeads(selectedLeads),
        conversationModal,
        setConversationModal,
        confirmationDialog,
        setConfirmationDialog,
        confirmAction,
        fetchStagedLeads,
    };
}