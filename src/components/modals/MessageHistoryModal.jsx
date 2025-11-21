import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const MessageHistoryModal = ({ isOpen, onClose, leadId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && leadId) {
      const fetchHistory = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('message_history')
          .select('*')
          .eq('lead_id', leadId)
          .order('sent_at', { ascending: false });

        if (error) {
          toast({
            variant: 'destructive',
            title: 'Erro ao buscar histórico',
            description: error.message,
          });
        } else {
          setHistory(data);
        }
        setLoading(false);
      };
      fetchHistory();
    }
  }, [isOpen, leadId, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de Disparos</DialogTitle>
          <DialogDescription>
            Exibindo mensagens enviadas para este lead.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma mensagem foi enviada ainda.</p>
          ) : (
            <ul className="space-y-4">
              {history.map((item) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">
                      {format(parseISO(item.sent_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        item.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status === 'sent' ? 'Enviado' : 'Falhou'}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-800 whitespace-pre-wrap">{item.message_body}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageHistoryModal;