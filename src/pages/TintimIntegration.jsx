import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, RefreshCw, Loader2, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext';
import { toTitleCase, normalizePhoneNumber } from '@/lib/leadUtils';
import { parseAndFormatTintimDate } from '@/lib/dateUtils';


const TintimIntegration = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [webhookUrl, setWebhookUrl] = useState('');
    const { settings, updateSetting, loading: settingsLoading } = useSettings();
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [recentEvents, setRecentEvents] = useState([]);
    const [deletingId, setDeletingId] = useState(null);
    const [sendingId, setSendingId] = useState(null);

    const isTintimDefault = settings?.inbox_source === 'tintim';

    const fetchRecentEvents = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('tintim_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Error fetching recent tintim events:', error);
        } else {
            setRecentEvents(data);
        }
    }, [user]);

    const generateWebhookUrl = useCallback((secret) => {
        if (!user || !secret) return '';
        const projectUrl = supabase.functions.url;
        if (projectUrl) {
            return `${projectUrl}/tintim-webhook?user_id=${user.id}&secret=${secret}`;
        }
        return 'Não foi possível carregar a URL.';
    }, [user, supabase.functions.url]);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        
        const { data, error } = await supabase
            .from('user_settings')
            .select('tintim_webhook_secret, inbox_source')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching tintim webhook settings:', error);
            toast({ title: 'Erro', description: 'Não foi possível carregar as configurações do webhook.', variant: 'destructive' });
        } else {
            const secret = data?.tintim_webhook_secret;
            if (secret) {
                setWebhookUrl(generateWebhookUrl(secret));
            } else {
                await handleRegenerateSecret(false);
            }
        }
        setLoading(false);
    }, [user, toast, generateWebhookUrl]);
    
    const handleSetInboxSource = async (source) => {
        await updateSetting('inbox_source', source);
        toast({
            title: 'Fonte da Caixa de Entrada atualizada!',
            description: `Agora, os leads de "${source === 'tintim' ? 'Tintim' : 'Webhook Genérico'}" irão para a Caixa de Entrada.`,
        });
    };
    
    const handleSendToInbox = async (event) => {
        if (!event || !event.payload) return;
        setSendingId(event.id);
        
        const leadData = event.payload.lead || {};
        const name =
            leadData.name ||
            event.payload.name ||
            event.payload?.contact?.name ||
            event.payload?.lead_name;
        const phone =
            leadData.phone ||
            event.payload.phone ||
            event.payload?.contact?.phone ||
            event.payload?.lead_phone;
        
        if (!name && !phone) {
            toast({ title: 'Erro', description: 'Evento sem nome ou telefone.', variant: 'destructive' });
            setSendingId(null);
            return;
        }

        const normalizedPhone = normalizePhoneNumber(phone);
        
        const { data: existingStagedLead, error: checkError } = await supabase
            .from('staged_leads')
            .select('id')
            .eq('user_id', user.id)
            .eq('whatsapp', normalizedPhone)
            .in('status', ['new', 'updated'])
            .maybeSingle();

        if (checkError) {
             toast({ title: 'Erro', description: 'Falha ao verificar duplicados.', variant: 'destructive' });
             setSendingId(null);
             return;
        }

        if (existingStagedLead) {
            toast({ title: 'Aviso', description: 'Este lead já está na Caixa de Entrada.', variant: 'default' });
            setSendingId(null);
            return;
        }
        
        const stagedLead = {
            user_id: user.id,
            nome: toTitleCase(name),
            whatsapp: normalizedPhone,
            email: leadData.email ? leadData.email.toLowerCase() : null,
            origem: leadData.source || null,
            data_recebimento: parseAndFormatTintimDate(event.payload.created),
            status: 'new',
            payload: event.payload
        };
        
        const { error: insertError } = await supabase
            .from('staged_leads')
            .insert(stagedLead);

        if (insertError) {
             toast({ title: 'Erro', description: 'Não foi possível enviar o lead para a Caixa de Entrada.', variant: 'destructive' });
        } else {
             toast({ title: 'Sucesso!', description: 'Lead enviado para a Caixa de Entrada.', className: 'bg-green-500 text-white' });
        }
        setSendingId(null);
    };

    const handleRegenerateSecret = useCallback(async (showToast = true) => {
        if (!user) return;
        setRegenerating(true);
        
        const newSecret = crypto.randomUUID();

        const { error: updateError } = await supabase
            .from('user_settings')
            .upsert({ user_id: user.id, tintim_webhook_secret: newSecret }, { onConflict: 'user_id' });
        
        if (updateError) {
            if(showToast) toast({ title: 'Erro', description: 'Não foi possível salvar o novo segredo.', variant: 'destructive' });
        } else {
            setWebhookUrl(generateWebhookUrl(newSecret));
            if(showToast) toast({ title: 'Sucesso!', description: 'Nova URL de webhook Tintim gerada com sucesso.' });
        }
        setRegenerating(false);
    }, [user, toast, generateWebhookUrl]);


    useEffect(() => {
      if (user) {
        fetchSettings();
        fetchRecentEvents();
      }
    }, [user, fetchSettings, fetchRecentEvents]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel(`tintim-webhooks-${user.id}`)
          .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'tintim_messages',
                filter: `user_id=eq.${user.id}`
            }, 
            (payload) => {
                setRecentEvents(currentEvents => [payload.new, ...currentEvents].slice(0, 20));
                toast({
                  title: "Nova Mensagem Tintim Recebida!",
                  description: `Evento do lead "${payload.new?.payload?.lead?.name || 'desconhecido'}" chegou.`,
                });
            }
          )
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [user, toast]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copiado!',
            description: `URL do Webhook Tintim copiada para a área de transferência.`,
        });
    };

    const handleDeleteEvent = async (eventId) => {
        setDeletingId(eventId);
        const { error } = await supabase
            .from('tintim_messages')
            .delete()
            .eq('id', eventId);

        if (error) {
            toast({ title: 'Erro', description: 'Não foi possível excluir o evento.', variant: 'destructive' });
        } else {
            setRecentEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
            toast({ title: 'Sucesso!', description: 'Evento excluído.' });
        }
        setDeletingId(null);
    };

    if (loading || settingsLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="ml-4 text-lg">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl font-bold mb-2">Webhook Tintim</h1>
                <p className="text-gray-600 dark:text-gray-400">Use esta URL para receber mensagens do sistema Tintim e configure a Caixa de Entrada.</p>
            </motion.div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Fonte da Caixa de Entrada</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Escolha qual webhook alimentará sua Caixa de Entrada. Apenas um pode ser ativo por vez.</p>
                <div className="flex gap-4">
                    <Button onClick={() => handleSetInboxSource('tintim')} variant={isTintimDefault ? 'default' : 'outline'} className="flex-1">
                        {isTintimDefault ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2 text-gray-400" />}
                        Usar Tintim como Padrão
                    </Button>
                    <Button onClick={() => handleSetInboxSource('generic')} variant={!isTintimDefault ? 'default' : 'outline'} className="flex-1">
                         {!isTintimDefault ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2 text-gray-400" />}
                        Usar Webhook Genérico
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Sua URL de Integração Tintim</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL do Webhook</label>
                        <div className="flex items-center gap-2">
                            <Input type="text" value={webhookUrl} readOnly className="font-mono bg-gray-100 dark:bg-gray-700" />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)} disabled={!webhookUrl || webhookUrl.includes('Não foi possível')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" onClick={() => handleRegenerateSecret(true)} disabled={regenerating}>
                                {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                <span className="ml-2 hidden sm:inline">Gerar Nova</span>
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                           Esta URL é exclusiva para a integração com o Tintim. Mantenha-a segura.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Eventos Recentes do Tintim (Ao Vivo)</h2>
                <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {recentEvents.length > 0 ? (
                            recentEvents.map(event => (
                                <motion.div
                                    key={event.id}
                                    layout
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.4, type: 'spring' }}
                                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md font-mono text-sm border-l-4 border-green-500"
                                >
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                            <span className="font-bold text-green-500 block">Lead: {event.payload?.lead?.name || "N/A"}</span>
                                            <span className="block text-xs text-gray-500">Recebido em: {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Button 
                                                variant="outline"
                                                size="sm" 
                                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                                                onClick={() => handleSendToInbox(event)}
                                                disabled={sendingId === event.id}
                                            >
                                                {sendingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                <span className="ml-2">Enviar p/ Caixa de Entrada</span>
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                                                onClick={() => handleDeleteEvent(event.id)}
                                                disabled={deletingId === event.id}
                                            >
                                                {deletingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-2 rounded">{JSON.stringify(event.payload, null, 2)}</pre>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">Aguardando eventos do Tintim...</p>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default TintimIntegration;