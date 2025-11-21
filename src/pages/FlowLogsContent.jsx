import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, CheckCircle, FileText, ChevronDown, ChevronUp, PlayCircle, PauseCircle, Send, Clock, Inbox, GitBranchPlus } from 'lucide-react';

const FlowLogsContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [instances, setInstances] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState('all');
  const [expandedInstance, setExpandedInstance] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: instancesData, error: instancesError } = await supabase
        .from('flow_instances')
        .select(`
          id,
          started_at,
          status,
          flow:follow_up_flows(id, name),
          lead:leads(id, nome),
          logs:flow_logs(
            id,
            created_at,
            event_type,
            message,
            details,
            node_id
          )
        `)
        .order('started_at', { ascending: false });

      if (instancesError) throw instancesError;

      const { data: flowsData, error: flowsError } = await supabase
        .from('follow_up_flows')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (flowsError) throw flowsError;

      const sortedInstances = instancesData.map(instance => ({
        ...instance,
        logs: instance.logs.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
      }));

      setInstances(sortedInstances);
      setFlows(flowsData);

    } catch (error) {
      toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredInstances = instances.filter(instance => 
    selectedFlow === 'all' || instance.flow?.id === selectedFlow
  );

  const getLogIcon = (log) => {
    if (log.message.includes('acionado por gatilho')) return <GitBranchPlus className="w-5 h-5 text-purple-500" />;
    if (log.message.includes('início')) return <PlayCircle className="w-5 h-5 text-green-500" />;
    if (log.message.includes('Aguardando por')) return <Clock className="w-5 h-5 text-yellow-500" />;
    if (log.message.includes('Mensagem enviada')) return <Send className="w-5 h-5 text-blue-500" />;
    if (log.message.includes('Falha')) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (log.message.includes('concluído')) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (log.message.includes('pausado')) return <PauseCircle className="w-5 h-5 text-gray-500" />;
    
    switch (log.event_type) {
      case 'SUCCESS': return <CheckCircle className="text-green-500 w-5 h-5" />;
      case 'ERROR': return <AlertTriangle className="text-red-500 w-5 h-5" />;
      default: return <FileText className="text-gray-500 w-5 h-5" />;
    }
  };

  const getInstanceStatusChip = (status) => {
    switch (status) {
      case 'running': return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Rodando</span>;
      case 'paused': return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Pausado</span>;
      case 'completed': return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Concluído</span>;
      case 'failed': return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Falhou</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle className="text-2xl font-bold mb-2 sm:mb-0">Logs dos Fluxos de Follow-up</CardTitle>
          <div className="w-full sm:w-64">
            <Select onValueChange={setSelectedFlow} defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por fluxo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Fluxos</SelectItem>
                {flows.map(flow => (
                  <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : filteredInstances.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                <Inbox className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 font-semibold">Nenhuma execução de fluxo encontrada.</p>
                <p className="text-sm">Tente ajustar os filtros ou aguarde um fluxo ser acionado.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {filteredInstances.map(instance => {
                  const isExpanded = expandedInstance === instance.id;
                  return (
                    <div key={instance.id} className="border-b last:border-b-0">
                      <div className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors`} onClick={() => setExpandedInstance(isExpanded ? null : instance.id)}>
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{instance.flow?.name || 'Fluxo desconhecido'}</p>
                            <p className="text-sm text-gray-500">para {instance.lead?.nome || 'Lead desconhecido'}</p>
                          </div>
                          <p className="text-sm text-gray-600">{format(parseISO(instance.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                          <div>{getInstanceStatusChip(instance.status)}</div>
                          <p className="text-sm text-gray-600">{instance.logs.length} eventos</p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {isExpanded ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-slate-50"
                          >
                            <div className="p-4 border-t">
                              <h4 className="font-semibold mb-3">Linha do Tempo da Execução</h4>
                              <div className="space-y-3">
                                {instance.logs.map(log => (
                                  <div key={log.id} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 pt-1">{getLogIcon(log)}</div>
                                    <div className="flex-grow">
                                      <p className="text-sm text-gray-800">{log.message}</p>
                                      <p className="text-xs text-gray-500">{format(parseISO(log.created_at), "HH:mm:ss", { locale: ptBR })}</p>
                                      {log.details && Object.keys(log.details).length > 0 && (
                                        <details className="mt-1">
                                          <summary className="text-xs cursor-pointer text-gray-600">Ver detalhes</summary>
                                          <pre className="mt-1 bg-gray-900 text-white p-2 rounded-md text-xs overflow-x-auto">
                                            {JSON.stringify(log.details, null, 2)}
                                          </pre>
                                        </details>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {instance.logs.length === 0 && <p className="text-sm text-gray-500">Nenhum evento registrado para esta execução ainda.</p>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FlowLogsContent;