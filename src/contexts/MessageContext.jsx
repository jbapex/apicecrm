import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const MessageContext = createContext();

export const useMessage = () => useContext(MessageContext);

const formatPhoneNumber = (number) => {
  if (!number) return '';
  let cleaned = number.replace(/\D/g, '');
  if (cleaned.length > 0 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
};

export const MessageProvider = ({ children }) => {
  const { user, session } = useAuth();
  const { settings, getStatusText } = useSettings();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const logMessage = async (leadId, messageBody, status, response, externalId) => {
    if (!user) return;
    try {
      await supabase.from('message_history').insert({
        lead_id: leadId,
        user_id: user.id,
        message_body: messageBody,
        status,
        response,
        external_id: externalId,
      });
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  };

  const sendMessage = useCallback(async (lead, messageBody, skipVariableReplacement = false) => {
    if (!settings) {
      toast({
        variant: 'destructive',
        title: 'Configurações não carregadas',
        description: 'Aguarde as configurações serem carregadas e tente novamente.',
      });
      return false;
    }
    const { apicebot_url, apicebot_token } = settings;

    if (!apicebot_url || !apicebot_token) {
      toast({
        variant: 'destructive',
        title: 'Configuração Incompleta',
        description: 'Vá para a página de integração do ÁpiceBot para configurar a URL e o Token.',
      });
      return false;
    }

    if (!lead || !lead.whatsapp) {
      toast({
        variant: 'destructive',
        title: 'Número Inválido',
        description: 'O lead não possui um número de WhatsApp válido.',
      });
      return false;
    }

    setIsSending(true);

    let processedMessage = messageBody;
    try {
      if (!skipVariableReplacement) {
        processedMessage = processedMessage.replace(/{{nome}}/g, lead.nome || '');
        processedMessage = processedMessage.replace(/{{whatsapp}}/g, lead.whatsapp || '');
        processedMessage = processedMessage.replace(/{{status}}/g, getStatusText(lead.status) || '');
      }

      const formattedNumber = formatPhoneNumber(lead.whatsapp);
      const externalKey = crypto.randomUUID();

      const payload = {
        number: formattedNumber,
        body: processedMessage,
        externalKey: externalKey,
        isClosed: false
      };

      const { data, error } = await supabase.functions.invoke('apicebot-proxy', {
        body: JSON.stringify({
          apiUrl: apicebot_url,
          apiToken: apicebot_token,
          payload: payload,
        }),
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.error) {
         throw new Error(data.error);
      }
      
      await logMessage(lead.id, processedMessage, 'sent', data, externalKey);
      
      toast({
        title: 'Mensagem Enviada!',
        description: `Mensagem enviada com sucesso para ${lead.nome}.`,
      });
      setIsSending(false);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      await logMessage(lead.id, processedMessage, 'failed', { error: error.message }, null);
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar Mensagem',
        description: error.message || 'Ocorreu uma falha desconhecida.',
      });
      setIsSending(false);
      return false;
    }
  }, [settings, toast, getStatusText, user, session]);

  return (
    <MessageContext.Provider value={{ sendMessage, isSending, formatPhoneNumber }}>
      {children}
    </MessageContext.Provider>
  );
};