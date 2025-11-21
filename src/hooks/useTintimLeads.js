import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { useLeads } from '@/hooks/useLeads.jsx';
import { format, parse, isWithinInterval, isValid } from 'date-fns';
import { normalizePhoneNumber, getPhoneVariations } from '@/lib/leadUtils.js';

const parsePayload = (payload) => {
    const leadData = payload?.lead;
    if (!leadData || (!leadData.name && !leadData.phone)) return null;
    
    const adData = leadData?.ad || {};

    let formattedDate = 'N/A';
    let rawDate = null;
    if (leadData.created) {
        try {
            const parsedDate = parse(leadData.created, "yyyy-MM-dd 'às' HH:mm:ss", new Date());
            if (isValid(parsedDate)) {
                formattedDate = format(parsedDate, 'dd/MM/yy');
                rawDate = parsedDate;
            }
        } catch(e) { console.error("Could not parse date:", leadData.created); }
    }
    
    const locationString = `${leadData.location?.state || ''}${leadData.location?.state && leadData.location?.country ? ', ' : ''}${leadData.location?.country || ''}`.replace(/^, |^ | $/g, '') || 'N/A';
    
    let source = leadData.source || 'Não Rastreada';
    if (source.toLowerCase() === 'não rasteada') source = 'Não Rastreada';

    return {
        name: leadData.name || 'N/A',
        phone: leadData.phone || 'N/A',
        source: source,
        created: formattedDate,
        raw_created_date: rawDate,
        location: locationString,
        ad_name: adData.ad_name || 'N/A',
        adset_name: adData.adset_name || 'N/A',
        campaign_name: adData.campaign_name || 'N/A',
    };
};

export const useTintimLeads = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { handleAddLead, handleBulkAddLeads } = useLeads();
    
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(null);
    const [existingLeads, setExistingLeads] = useState(new Map());
    const [selectedEvents, setSelectedEvents] = useState(new Set());
    const [filters, setFilters] = useState({
        searchTerm: '',
        dateRange: null,
        source: 'all',
        status: 'all',
    });

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const fetchEventsAndLeads = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [eventsResponse, leadsResponse] = await Promise.all([
                supabase.from('tintim_messages').select('*').order('created_at', { ascending: false }),
                supabase.from('leads').select('*').eq('user_id', user.id)
            ]);
            if (eventsResponse.error) throw eventsResponse.error;
            if (leadsResponse.error) throw leadsResponse.error;
            setEvents(eventsResponse.data || []);
            setExistingLeads(new Map((leadsResponse.data || []).map(lead => [normalizePhoneNumber(lead.whatsapp), lead])));
        } catch (error) {
            toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => { fetchEventsAndLeads(); }, [fetchEventsAndLeads]);

    const findExistingLead = useCallback((phone) => {
        const variations = getPhoneVariations(phone);
        for (const variation of variations) {
            if (existingLeads.has(variation)) {
                return existingLeads.get(variation);
            }
        }
        return null;
    }, [existingLeads]);

    const handleConsolidateLead = async (e, event) => {
        e.stopPropagation();
        setActionInProgress(event.id);
        const parsed = parsePayload(event.payload);
        if (!parsed) {
            toast({ title: 'Erro ao consolidar', description: 'Dados do evento inválidos.', variant: 'destructive' });
            setActionInProgress(null);
            return false;
        }

        const existingLead = findExistingLead(parsed.phone);
        if (existingLead) {
            const newCustomFields = { ...existingLead.custom_fields, tintim_lead_info: { location: parsed.location, campaign_name: parsed.campaign_name, adset_name: parsed.adset_name, ad_name: parsed.ad_name, source: parsed.source, consolidated_at: new Date().toISOString() } };
            const { data: updatedLead, error } = await supabase.from('leads').update({ custom_fields: newCustomFields, updated_at: new Date().toISOString() }).eq('id', existingLead.id).select('*').single();
            if (error) {
                toast({ title: 'Erro ao atualizar lead', description: error.message, variant: 'destructive' });
                setActionInProgress(null);
                return false;
            }
            setExistingLeads(prev => new Map(prev).set(normalizePhoneNumber(updatedLead.whatsapp), updatedLead));
            toast({ title: 'Lead Consolidado!', description: `Lead "${parsed.name}" consolidado com sucesso.` });
            setActionInProgress(null);
            return true;
        } else {
            toast({ title: 'Lead não encontrado', description: 'Este lead não existe mais na sua lista. A página será atualizada.', variant: 'default' });
            setActionInProgress(null);
            fetchEventsAndLeads();
            return false;
        }
    };

    const handleCreateLead = async (e, event) => {
        e.stopPropagation();
        setActionInProgress(event.id);
        const parsed = parsePayload(event.payload);
        if (!parsed) {
            toast({ title: 'Erro ao criar lead', description: 'Dados do evento inválidos.', variant: 'destructive' });
            setActionInProgress(null);
            return;
        }
        
        const newLeadData = {
            nome: parsed.name,
            whatsapp: parsed.phone,
            origem: parsed.source,
            status: 'novo',
            data_entrada: parsed.raw_created_date ? parsed.raw_created_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            custom_fields: { tintim_lead_info: { location: parsed.location, campaign_name: parsed.campaign_name, adset_name: parsed.adset_name, ad_name: parsed.ad_name, source: parsed.source, consolidated_at: new Date().toISOString() } }
        };

        const createdLead = await handleAddLead(newLeadData, false);
        
        if (createdLead) {
            setExistingLeads(prev => new Map(prev).set(normalizePhoneNumber(createdLead.whatsapp), createdLead));
            toast({ title: 'Lead Criado!', description: `O lead "${parsed.name}" foi criado e consolidado.` });
        } else {
            toast({ title: 'Falha ao Criar', description: `Não foi possível criar o lead "${parsed.name}".`, variant: 'destructive' });
        }
        setActionInProgress(null);
    };

    const handleDeleteEvent = async (e, eventId) => {
        e.stopPropagation();
        setActionInProgress(eventId);
        const { error } = await supabase.from('tintim_messages').delete().eq('id', eventId);
        if (error) {
            toast({ title: 'Erro ao excluir evento', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Evento excluído', description: 'O evento foi removido da lista.' });
            setEvents(prev => prev.filter(e => e.id !== eventId));
        }
        setActionInProgress(null);
    };

    const handleBulkConsolidate = async () => {
        setActionInProgress('bulk-consolidate');
        const eventsToConsolidate = filteredEvents.filter(e => selectedEvents.has(e.id) && e.canConsolidate && !e.isConsolidated);
        let successCount = 0;
        
        for (const event of eventsToConsolidate) {
            const success = await handleConsolidateLead({ stopPropagation: () => {} }, event);
            if(success) successCount++;
        }
        
        if(successCount > 0) toast({ title: 'Consolidação em Massa Finalizada', description: `${successCount} leads consolidados.`});
        setSelectedEvents(new Set());
        setActionInProgress(null);
    };

    const handleBulkCreate = async () => {
        setActionInProgress('bulk-create');
        const eventsToCreate = filteredEvents.filter(e => selectedEvents.has(e.id) && !e.canConsolidate);
        
        const newLeadsData = eventsToCreate.map(event => {
            const parsed = parsePayload(event.payload);
            return {
                nome: parsed.name,
                whatsapp: parsed.phone,
                origem: parsed.source,
                status: 'novo',
                data_entrada: parsed.raw_created_date ? parsed.raw_created_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                custom_fields: { tintim_lead_info: { location: parsed.location, campaign_name: parsed.campaign_name, adset_name: parsed.adset_name, ad_name: parsed.ad_name, source: parsed.source, consolidated_at: new Date().toISOString() } }
            };
        });

        if (newLeadsData.length > 0) {
            const { success, createdCount, createdLeads } = await handleBulkAddLeads(newLeadsData);
            if (success) {
                toast({ title: 'Criação em Massa Finalizada', description: `${createdCount} leads criados com sucesso.` });
                const newLeadsMap = new Map(createdLeads.map(lead => [normalizePhoneNumber(lead.whatsapp), lead]));
                setExistingLeads(prev => new Map([...prev, ...newLeadsMap]));
            }
        } else {
            toast({ title: 'Nenhum lead para criar', description: 'Nenhum dos eventos selecionados era elegível para criação.', variant: 'default' });
        }

        setSelectedEvents(new Set());
        setActionInProgress(null);
    };

    const filteredEvents = useMemo(() => {
        const allParsed = events.map(event => {
            const parsedData = parsePayload(event.payload);
            if (!parsedData || !parsedData.phone) return null;
            
            const leadDetails = findExistingLead(parsedData.phone);
            const canConsolidate = !!leadDetails;
            const isConsolidated = !!(leadDetails?.custom_fields?.tintim_lead_info?.consolidated_at);
            
            let consolidationStatus = 'new';
            if (canConsolidate) {
                consolidationStatus = isConsolidated ? 'consolidated' : 'pending';
            }

            return { ...event, parsed: parsedData, leadStatus: leadDetails?.status, leadValue: leadDetails?.valor, canConsolidate, isConsolidated, consolidationStatus };
        }).filter(event => event !== null);

        const uniqueEventsByPhone = [];
        const seenPhones = new Set();
        for (const event of allParsed) {
            const variations = getPhoneVariations(event.parsed.phone);
            if (!variations.some(v => seenPhones.has(v))) {
                uniqueEventsByPhone.push(event);
                variations.forEach(v => seenPhones.add(v));
            }
        }

        return uniqueEventsByPhone.filter(event => {
            const { dateRange, searchTerm, source, status } = filters;
            
            if (dateRange && dateRange.from && dateRange.to) {
                if (!event.parsed?.raw_created_date || !isWithinInterval(event.parsed.raw_created_date, { start: dateRange.from, end: dateRange.to })) {
                    return false;
                }
            }
            
            if (searchTerm) {
                const lowercasedSearchTerm = searchTerm.toLowerCase();
                if (!event.parsed.name.toLowerCase().includes(lowercasedSearchTerm) && !event.parsed.phone.includes(lowercasedSearchTerm)) {
                    return false;
                }
            }

            if (source !== 'all' && event.parsed.source !== source) {
                return false;
            }

            if (status !== 'all' && event.consolidationStatus !== status) {
                return false;
            }

            return true;
        });
    }, [events, findExistingLead, filters]);

    const sourceStats = useMemo(() => {
        const stats = filteredEvents.reduce((acc, event) => {
            const source = event.parsed.source;
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});
        return { total: filteredEvents.length, 'Meta Ads': stats['Meta Ads'] || 0, 'Google Ads': stats['Google Ads'] || 0, 'Não Rastreada': stats['Não Rastreada'] || 0 };
    }, [filteredEvents]);
    
    const handleSelectEvent = (eventId, checked) => {
        setSelectedEvents(prev => {
            const newSet = new Set(prev);
            if (checked) newSet.add(eventId);
            else newSet.delete(eventId);
            return newSet;
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
        } else {
            setSelectedEvents(new Set());
        }
    };

    const numToConsolidate = useMemo(() => {
        return filteredEvents.filter(e => selectedEvents.has(e.id) && e.canConsolidate && !e.isConsolidated).length;
    }, [selectedEvents, filteredEvents]);

    const numToCreate = useMemo(() => {
        return filteredEvents.filter(e => selectedEvents.has(e.id) && !e.canConsolidate).length;
    }, [selectedEvents, filteredEvents]);

    return {
        loading,
        actionInProgress,
        filteredEvents,
        sourceStats,
        filters,
        selectedEvents,
        numToConsolidate,
        numToCreate,
        handleFilterChange,
        handleSelectEvent,
        handleSelectAll,
        handleConsolidateLead,
        handleCreateLead,
        handleDeleteEvent,
        handleBulkConsolidate,
        handleBulkCreate,
        fetchEventsAndLeads,
        setExistingLeads,
        existingLeads,
        findExistingLead
    };
};