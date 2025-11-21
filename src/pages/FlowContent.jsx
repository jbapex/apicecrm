import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Plus, GitMerge, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import FlowBuilder from '@/components/flow/FlowBuilder';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const FlowContent = () => {
  const { user } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState(null);

  useEffect(() => {
    const fetchFlows = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('follow_up_flows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching flows:', error);
      } else {
        setFlows(data);
      }
      setLoading(false);
    };

    fetchFlows();
  }, [user]);

  const handleCreateNewFlow = async () => {
    const { data, error } = await supabase
      .from('follow_up_flows')
      .insert({
        user_id: user.id,
        name: 'Novo Fluxo de Follow-up',
        description: 'Descreva o objetivo deste fluxo.',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating new flow', error);
    } else {
      setFlows([data, ...flows]);
      setSelectedFlow(data);
    }
  };

  const handleUpdateFlow = (updatedFlow) => {
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
  };
  
  const handleDeleteFlow = async (flowId) => {
     const { error } = await supabase.from('follow_up_flows').delete().eq('id', flowId);
     if (error) {
       console.error('Error deleting flow', error);
     } else {
       setFlows(flows.filter(f => f.id !== flowId));
     }
  };


  if (selectedFlow) {
    return (
      <FlowBuilder
        flow={selectedFlow}
        onBack={() => setSelectedFlow(null)}
        onUpdate={handleUpdateFlow}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Flow de Follow-up</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Crie e gerencie seus fluxos de automação de follow-up.
          </p>
        </div>
        <Button onClick={handleCreateNewFlow}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Flow
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : flows.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <GitMerge className="w-16 h-16 mx-auto text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">Nenhum fluxo encontrado</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Comece criando seu primeiro fluxo de follow-up.</p>
          <Button onClick={handleCreateNewFlow} className="mt-6">
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Flow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {flows.map((flow) => (
            <motion.div
              key={flow.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{flow.name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedFlow(flow)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteFlow(flow.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 h-12 overflow-hidden">{flow.description}</p>
                
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-between items-center rounded-b-lg">
                 <div className={`flex items-center text-sm font-medium ${flow.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`h-2.5 w-2.5 rounded-full mr-2 ${flow.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {flow.is_active ? 'Ativo' : 'Inativo'}
                </div>
                <Button variant="secondary" size="sm" onClick={() => setSelectedFlow(flow)}>Abrir Editor</Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FlowContent;