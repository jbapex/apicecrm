import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SelectFlowModal = ({ isOpen, onClose, onSelectFlow, leadId, isChangingFlow }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flows, setFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      const fetchFlows = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('follow_up_flows')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching flows:', error);
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar fluxos',
            description: error.message,
          });
        } else {
          setFlows(data);
        }
        setLoading(false);
      };
      fetchFlows();
    } else {
      setFlows([]);
      setSelectedFlowId('');
    }
  }, [isOpen, user, toast]);

  const handleConfirm = () => {
    if (selectedFlowId && leadId) {
      onSelectFlow(leadId, selectedFlowId);
      onClose();
    } else {
      toast({
        variant: 'destructive',
        title: 'Seleção inválida',
        description: 'Por favor, selecione um fluxo para iniciar.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {isChangingFlow ? 'Trocar Fluxo' : 'Iniciar Fluxo Manualmente'}
          </DialogTitle>
          <DialogDescription>
            {isChangingFlow 
              ? 'O fluxo atual será interrompido. Selecione o novo fluxo para este lead.'
              : 'Selecione o fluxo que deseja iniciar para este lead.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <Select onValueChange={setSelectedFlowId} value={selectedFlowId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um fluxo" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {flows.length === 0 ? (
                  <div className="p-2 text-center text-gray-500">Nenhum fluxo ativo encontrado.</div>
                ) : (
                  flows.map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!selectedFlowId || loading}>
            {isChangingFlow ? 'Confirmar Troca' : 'Iniciar Fluxo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectFlowModal;