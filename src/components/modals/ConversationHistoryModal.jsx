import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const ConversationHistoryModal = ({ isOpen, onClose, phone }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && phone) {
      const fetchHistory = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('tintim_messages')
          .select('id, created_at, payload')
          .eq('payload->lead->>phone', phone)
          .order('created_at', { ascending: true });

        if (error) {
          toast({
            variant: 'destructive',
            title: 'Erro ao buscar histórico',
            description: error.message,
          });
        } else {
          setHistory(data.filter(item => item.payload.message));
        }
        setLoading(false);
      };
      fetchHistory();
    }
  }, [isOpen, phone, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Histórico da Conversa</DialogTitle>
          <DialogDescription>
            Exibindo mensagens trocadas com o número {phone}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full pr-4">
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
                <p className="font-semibold">Nenhuma mensagem encontrada</p>
                <p className="text-sm">Não há histórico de conversas para este contato.</p>
              </div>
            ) : (
              <ul className="flex flex-col space-y-2">
                {history.map((item) => {
                  const isSentByUser = item.payload.from_me === true;
                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn('flex flex-col', {
                        'items-end': isSentByUser,
                        'items-start': !isSentByUser,
                      })}
                    >
                      <div
                        className={cn('max-w-xs rounded-lg p-3', {
                          'bg-blue-100 text-blue-900': isSentByUser,
                          'bg-gray-200 text-gray-800': !isSentByUser,
                        })}
                      >
                        <p className="whitespace-pre-wrap break-words">{item.payload.message}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {format(parseISO(item.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationHistoryModal;