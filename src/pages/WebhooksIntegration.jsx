import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, RefreshCw, Loader2, Trash2, Inbox, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const WebhooksIntegration = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [webhookUrl, setWebhookUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [recentEvents, setRecentEvents] = useState([]);
    const [deletingId, setDeletingId] = useState(null);
    const [inboxSource, setInboxSource] = useState(null);
    const [updatingSource, setUpdatingSource] = useState(false);

    const fetchRecentEvents = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('generic_webhook_events')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) {
            console.error('Error fetching recent events:', error);
        } else {
            setRecentEvents(data);
        }
    }, [user]);

    const generateWebhookUrl = useCallback((secret) => {
        if (!user || !secret) return '';
        const projectUrl = supabase.functions.url;
        if (projectUrl) {
            return `${projectUrl}/generic-webhook?user_id=${user.id}&secret=${secret}`;
        }
        return 'Não foi possível carregar a URL.';
    }, [user]);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        
        const { data, error } = await supabase
            .from('user_settings')
            .select('generic_webhook_secret, inbox_source')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching webhook settings:', error);
            toast({ title: 'Erro', description: 'Não foi possível carregar as configurações do webhook.', variant: 'destructive' });
        } else {
            const secret = data?.generic_webhook_secret;
            setInboxSource(data?.inbox_source || 'generic');
            if (secret) {
                setWebhookUrl(generateWebhookUrl(secret));
            } else {
                await handleRegenerateSecret(false);
            }
        }
        setLoading(false);
    }, [user, toast, generateWebhookUrl]);

    useEffect(() => {
        fetchSettings();
        fetchRecentEvents();
    }, [fetchSettings, fetchRecentEvents]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel(`generic-webhooks-${user.id}`)
          .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'generic_webhook_events',
                filter: `user_id=eq.${user.id}`
            }, 
            (payload) => {
                if (inboxSource !== 'generic') {
                    setRecentEvents(currentEvents => [payload.new, ...currentEvents].slice(0, 20));
                    toast({
                      title: "Novo Evento Recebido!",
                      description: `Evento do tipo "${payload.new.event_type}" chegou.`,
                    });
                }
            }
          )
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [user, toast, inboxSource]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copiado!',
            description: `URL do Webhook copiada para a área de transferência.`,
        });
    };

    const handleRegenerateSecret = async (showToast = true) => {
        if (!user) return;
        setRegenerating(true);
        
        const newSecret = crypto.randomUUID();

        const { error: updateError } = await supabase
            .from('user_settings')
            .upsert({ user_id: user.id, generic_webhook_secret: newSecret }, { onConflict: 'user_id' });
        
        if (updateError) {
            if(showToast) toast({ title: 'Erro', description: 'Não foi possível salvar o novo segredo.', variant: 'destructive' });
        } else {
            setWebhookUrl(generateWebhookUrl(newSecret));
            if(showToast) toast({ title: 'Sucesso!', description: 'Nova URL de webhook gerada com sucesso.' });
        }
        setRegenerating(false);
    };

    const handleDeleteEvent = async (eventId) => {
        setDeletingId(eventId);
        const { error } = await supabase
            .from('generic_webhook_events')
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

    const handleSetInboxSource = async () => {
        if (!user) return;
        setUpdatingSource(true);

        const { error } = await supabase
            .from('user_settings')
            .update({ inbox_source: 'generic' })
            .eq('user_id', user.id);

        if (error) {
            toast({ title: 'Erro', description: 'Não foi possível definir como padrão.', variant: 'destructive' });
        } else {
            setInboxSource('generic');
            toast({ title: 'Sucesso!', description: 'Webhook Genérico definido como padrão para a Caixa de Entrada.' });
        }
        setUpdatingSource(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="ml-4 text-lg">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Webhook Genérico</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Use esta URL de webhook para enviar eventos de qualquer sistema externo para o seu CRM.</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">Sua URL Segura</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL do Webhook</label>
                        <div className="flex items-center gap-2">
                            <Input type="text" value={webhookUrl} readOnly className="font-mono" />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)} disabled={!webhookUrl || webhookUrl.includes('Carregando') || webhookUrl.includes('Não foi possível')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" onClick={() => handleRegenerateSecret(true)} disabled={regenerating}>
                                {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                <span className="ml-2 hidden sm:inline">Gerar Nova URL</span>
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Esta URL já contém seu segredo de autenticação. Mantenha-a segura e não a compartilhe publicamente.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-2">Caixa de Entrada</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Defina esta integração como a fonte padrão para novos leads na sua Caixa de Entrada.</p>
                {inboxSource === 'generic' ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/30 p-3 rounded-md">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Webhook Genérico é a fonte padrão da Caixa de Entrada.</span>
                    </div>
                ) : (
                    <Button onClick={handleSetInboxSource} disabled={updatingSource}>
                        {updatingSource ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Inbox className="h-4 w-4 mr-2" />}
                        Tornar Padrão para Caixa de Entrada
                    </Button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Eventos Recentes (Ao Vivo)</h2>
                 {inboxSource === 'generic' && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm">
                        Os leads do Webhook Genérico estão sendo enviados diretamente para a Caixa de Entrada. Os eventos não serão listados aqui.
                    </div>
                )}
                <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {recentEvents.length > 0 ? (
                            recentEvents.map(event => (
                                <motion.div
                                    key={event.id}
                                    layout
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, type: 'spring' }}
                                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md font-mono text-sm border-l-4 border-blue-500"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-bold text-blue-500">{event.event_type}</span>
                                            <span className="block text-xs text-gray-500">{format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span>
                                        </div>
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
                                    <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-2 rounded">{JSON.stringify(event.payload, null, 2)}</pre>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">Aguardando eventos...</p>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default WebhooksIntegration;