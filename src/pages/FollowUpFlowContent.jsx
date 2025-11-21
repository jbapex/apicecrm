import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Workflow, Loader2, ToggleLeft, ToggleRight, Trash2, Edit, Zap, Tag, RefreshCw, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FlowBuilder from '@/components/flow/FlowBuilder.jsx';
import { AnimatePresence, motion } from 'framer-motion';

const FollowUpFlowContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);

  const fetchFlows = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('follow_up_flows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar fluxos", description: error.message, variant: "destructive" });
    } else {
      setFlows(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const handleCreateNewFlow = () => {
    setSelectedFlow({
      name: 'Novo Fluxo de Follow-up',
      trigger_type: 'manual',
      trigger_config: {},
      nodes: [
        { id: 'start', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Início' } },
        { id: 'end', type: 'end', position: { x: 100, y: 400 }, data: { label: 'Fim' } },
      ],
      edges: [],
    });
  };

  const handleSaveFlow = async (flowData) => {
    const { id, ...dataToSave } = flowData;
    let savedData;
    let error;

    if (id) {
      // Update existing flow
      const { data, error: updateError } = await supabase
        .from('follow_up_flows')
        .update(dataToSave)
        .eq('id', id)
        .select()
        .single();
      savedData = data;
      error = updateError;
    } else {
      // Insert new flow
      const { data, error: insertError } = await supabase
        .from('follow_up_flows')
        .insert(dataToSave)
        .select()
        .single();
      savedData = data;
      error = insertError;
    }

    if (error) {
      toast({ title: "Erro ao salvar fluxo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fluxo salvo com sucesso!" });
      fetchFlows();
      setSelectedFlow(null);
    }
  };
  
  const handleToggleActive = async (flow) => {
    const { data, error } = await supabase
      .from('follow_up_flows')
      .update({ is_active: !flow.is_active })
      .eq('id', flow.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    } else {
      setFlows(flows.map(f => f.id === data.id ? data : f));
      toast({ title: `Fluxo "${data.name}" ${data.is_active ? 'ativado' : 'desativado'}.` });
    }
  };

  const handleDeleteFlow = async () => {
    if (!showDeleteDialog) return;
    const { error } = await supabase.from('follow_up_flows').delete().eq('id', showDeleteDialog.id);
    if (error) {
      toast({ title: "Erro ao excluir fluxo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fluxo excluído com sucesso!" });
      setFlows(flows.filter(f => f.id !== showDeleteDialog.id));
      setShowDeleteDialog(null);
    }
  };

  const getTriggerIcon = (type) => {
    switch (type) {
      case 'manual': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'status': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'tag': return <Tag className="w-4 h-4 text-purple-500" />;
      case 'origin': return <MapPin className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const getTriggerText = (type) => {
    switch (type) {
      case 'manual': return 'Manual';
      case 'status': return 'Por Status do Lead';
      case 'tag': return 'Por Tag do Lead';
      case 'origin': return 'Por Origem do Lead';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="relative w-full h-full">
      <AnimatePresence>
        {selectedFlow && (
           <motion.div
             key="flow-builder"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="absolute inset-0 z-30 bg-white"
           >
            <FlowBuilder 
              flow={selectedFlow} 
              onBack={() => setSelectedFlow(null)} 
              onSave={handleSaveFlow} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Fluxos de Follow-up</h1>
          <Button 
            onClick={handleCreateNewFlow} 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" /> Criar Novo Fluxo
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg border-gray-300 bg-gray-50">
            <Workflow className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Nenhum fluxo encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Comece criando seu primeiro fluxo de automação para impulsionar seus resultados!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map(flow => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between border border-gray-100 dark:border-gray-700"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-4" title={flow.name}>{flow.name}</h2>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={!!flow.is_active}
                        onCheckedChange={() => handleToggleActive(flow)}
                        aria-label={`Ativar/desativar fluxo ${flow.name}`}
                      />
                      {flow.is_active ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-400" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    {getTriggerIcon(flow.trigger_type)}
                    Gatilho: {getTriggerText(flow.trigger_type)}
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" size="icon" onClick={() => setShowDeleteDialog(flow)} className="hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => setSelectedFlow(flow)} className="bg-blue-500 hover:bg-blue-600 text-white shadow-md">
                    <Edit className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <AlertDialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o fluxo "{showDeleteDialog?.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteFlow} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default FollowUpFlowContent;