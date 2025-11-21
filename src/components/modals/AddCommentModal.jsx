import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AddCommentModal = ({ isOpen, onClose, leadId }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && leadId) {
      const fetchComments = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('lead_comments')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });

        if (error) {
          toast({
            variant: 'destructive',
            title: 'Erro ao buscar comentários',
            description: error.message,
          });
        } else {
          setComments(data);
        }
        setLoading(false);
      };
      fetchComments();
    }
  }, [isOpen, leadId, toast]);

  const handleSaveComment = async () => {
    if (!comment.trim()) {
      toast({
        variant: 'destructive',
        title: 'Comentário vazio',
        description: 'Por favor, escreva um comentário antes de salvar.',
      });
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('lead_comments')
      .insert([{ lead_id: leadId, comment: comment.trim(), user_id: user.id }])
      .select();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar comentário',
        description: error.message,
      });
    } else {
      toast({
        title: 'Sucesso!',
        description: 'Seu comentário foi salvo.',
      });
      setComments([data[0], ...comments]);
      setComment('');
    }
    setSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Comentários do Lead</DialogTitle>
          <DialogDescription>
            Adicione e visualize comentários para este lead.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <Textarea
              placeholder="Adicionar um novo comentário..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleSaveComment} disabled={saving} className="mt-2 w-full">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Salvar Comentário'
              )}
            </Button>
          </div>
          <div className="max-h-[40vh] overflow-y-auto pr-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum comentário ainda.</p>
            ) : (
              comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.comment}</p>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    {format(parseISO(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCommentModal;