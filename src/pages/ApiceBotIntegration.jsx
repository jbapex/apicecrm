import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, Zap, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';

const WebhookSection = ({ userId }) => {
  const { toast } = useToast();
  const [stats, setStats] = useState({ queued: 0, done: 0, error: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('Carregando URL...');

  useEffect(() => {
    const getUrl = () => {
      const { functionsUrl } = supabase;
      if (functionsUrl) {
        setWebhookUrl(`${functionsUrl}/apicebot-webhook?user_id=${userId}`);
      } else {
        setWebhookUrl('Não foi possível carregar a URL.');
      }
    };
    getUrl();
  }, [userId]);

  const copyToClipboard = () => {
    if (webhookUrl.includes('Carregando') || webhookUrl.includes('Não foi possível')) return;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Copiado!",
      description: "A URL do webhook foi copiada para a área de transferência.",
    });
  };

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    const { data, error } = await supabase.rpc('get_webhook_stats');
    if (error) {
      console.error('Error fetching webhook stats:', error);
      toast({ variant: "destructive", title: "Erro ao buscar estatísticas." });
    } else {
      setStats(data[0] || { queued: 0, done: 0, error: 0 });
    }
    setLoadingStats(false);
  }, [toast]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh stats every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleReprocess = async () => {
    setReprocessing(true);
    const { error } = await supabase.rpc('reprocess_failed_webhooks');
    if (error) {
      toast({ variant: "destructive", title: "Erro ao reprocessar", description: error.message });
    } else {
      toast({ title: "Sucesso", description: "Eventos com falha foram reenfileirados para processamento." });
      fetchStats();
    }
    setReprocessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.3 }}
      className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300">Webhook para Receber Eventos</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Use esta URL no ÁpiceBot para nos enviar eventos em tempo real.
      </p>
      <div className="mt-4 flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-md">
        <Input type="text" readOnly value={webhookUrl} className="flex-grow bg-transparent border-none text-sm" />
        <Button variant="ghost" size="icon" onClick={copyToClipboard} disabled={webhookUrl.includes('Carregando') || webhookUrl.includes('Não foi possível')}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Na Fila</p>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{loadingStats ? '...' : stats.queued}</p>
        </div>
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">Concluídos</p>
          <p className="text-2xl font-bold text-green-800 dark:text-green-300">{loadingStats ? '...' : stats.done}</p>
        </div>
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Com Erro</p>
          <p className="text-2xl font-bold text-red-800 dark:text-red-300">{loadingStats ? '...' : stats.error}</p>
        </div>
        <Button onClick={handleReprocess} disabled={reprocessing || stats.error === 0} className="w-full h-full">
          <RefreshCw className={`w-4 h-4 mr-2 ${reprocessing ? 'animate-spin' : ''}`} />
          Reprocessar Falhos
        </Button>
      </div>
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Segurança</h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            O token de segurança para o webhook é o mesmo "Bearer Token" que você usa para enviar mensagens. Mantenha-o seguro.
          </p>
        </div>
      </div>
    </motion.div>
  );
};


const ApiceBotIntegration = () => {
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    apicebot_url: '',
    apicebot_token: '',
  });
  const [savingStatus, setSavingStatus] = useState('saved'); // saved, typing, saving, error

  useEffect(() => {
    if (settings) {
      setFormData({
        apicebot_url: settings.apicebot_url || '',
        apicebot_token: settings.apicebot_token || '',
      });
    }
  }, [settings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSavingStatus('typing');
  };

  const saveChanges = useCallback(async (data) => {
    setSavingStatus('saving');
    const success = await updateSettings({
      apicebot_url: data.apicebot_url,
      apicebot_token: data.apicebot_token,
    }, false);

    if (success) {
      setSavingStatus('saved');
    } else {
      setSavingStatus('error');
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [updateSettings, toast]);

  useEffect(() => {
    if (savingStatus === 'typing') {
      const handler = setTimeout(() => {
        saveChanges(formData);
      }, 1500);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [formData, savingStatus, saveChanges]);

  const getStatusIndicator = () => {
    switch (savingStatus) {
      case 'typing':
        return <span className="text-sm text-yellow-600">Digitando...</span>;
      case 'saving':
        return (
          <span className="text-sm text-blue-600 flex items-center">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Salvando...
          </span>
        );
      case 'saved':
        return (
          <span className="text-sm text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" /> Salvo
          </span>
        );
      case 'error':
        return <span className="text-sm text-red-600">Erro ao salvar</span>;
      default:
        return null;
    }
  };
  
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl font-bold text-gray-800 dark:text-white"
          >
            <Zap className="inline-block w-8 h-8 mr-2 text-blue-500" />
            Integração ÁpiceBot
          </motion.h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Conecte seu CRM ao ÁpiceBot para automatizar a comunicação.
          </p>
        </div>

        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Configuração de Envio</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Configure as credenciais para enviar mensagens através do ÁpiceBot. As alterações são salvas automaticamente.
          </p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="apicebot_url" className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  URL do Endpoint
                </Label>
                {getStatusIndicator()}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Insira a URL completa fornecida pelo ÁpiceBot para envio de mensagens.
              </p>
              <Input
                id="apicebot_url"
                name="apicebot_url"
                type="url"
                value={formData.apicebot_url}
                onChange={handleInputChange}
                placeholder="https://crmapi.apicebot.com.br/v2/api/external/..."
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="apicebot_token" className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Bearer Token
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Cole aqui o seu token de autorização para envio.
              </p>
              <Input
                id="apicebot_token"
                name="apicebot_token"
                type="password"
                value={formData.apicebot_token}
                onChange={handleInputChange}
                placeholder="••••••••••••••••••••"
                required
                className="mt-1"
              />
            </div>
          </div>
        </motion.div>

        {user && <WebhookSection userId={user.id} />}

      </div>
    </motion.div>
  );
};

export default ApiceBotIntegration;