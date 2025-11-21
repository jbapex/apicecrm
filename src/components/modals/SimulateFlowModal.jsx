import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Play, Loader2, Bot, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessage } from '@/contexts/MessageContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/components/ui/use-toast';

const SimulateFlowModal = ({ isOpen, onClose, flow }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { sendMessage } = useMessage();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [simulationLog, setSimulationLog] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('leads')
        .select('id, nome, whatsapp, status')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });
      if (error) console.error('Error fetching leads:', error);
      else setLeads(data);
    };
    if (isOpen) {
        fetchLeads();
    }
  }, [user, isOpen]);

  const addLog = (message, type = 'info', icon) => {
    setSimulationLog(prev => [...prev, { message, type, icon, timestamp: new Date() }]);
  };

  const runSimulation = useCallback(async () => {
    if (!selectedLead || !flow) return;

    setIsSimulating(true);
    setSimulationLog([]);
    addLog(`Iniciando simulação REAL para o lead: ${selectedLead.nome}`, 'info', <Play className="w-4 h-4 text-blue-500" />);

    const { apicebot_url, apicebot_token } = settings;
    if (!apicebot_url || !apicebot_token) {
      addLog('Configuração do ÁpiceBot incompleta. A simulação não pode continuar.', 'error', <AlertTriangle className="w-4 h-4 text-red-500" />);
      toast({ title: 'Configuração Incompleta', description: 'URL ou Token do ÁpiceBot não encontrados.', variant: 'destructive' });
      setIsSimulating(false);
      return;
    }

    let currentNodeId = flow.nodes.find(n => n.type === 'start')?.id;
    if (!currentNodeId) {
        addLog(`Erro: Nó de início não encontrado. Finalizando simulação.`, 'error', <AlertTriangle className="w-4 h-4 text-red-500" />);
        setIsSimulating(false);
        return;
    }

    while (currentNodeId) {
      const currentNode = flow.nodes.find(n => n.id === currentNodeId);
      if (!currentNode) {
        addLog(`Erro: Nó com ID ${currentNodeId} não encontrado. Finalizando simulação.`, 'error', <AlertTriangle className="w-4 h-4 text-red-500" />);
        break;
      }

      switch (currentNode.type) {
        case 'start':
          addLog('Fluxo iniciado.', 'info', <Play className="w-4 h-4 text-blue-500" />);
          break;
        case 'sendMessage': {
          const messageBody = currentNode.data.content || '';
          addLog(`Preparando para enviar a mensagem: "${messageBody}"`, 'info', <Bot className="w-4 h-4 text-gray-500" />);
          const success = await sendMessage(selectedLead, messageBody);
          if (success) {
            addLog(`Mensagem enviada com sucesso para ${selectedLead.nome}.`, 'success', <Bot className="w-4 h-4 text-green-500" />);
          } else {
            addLog(`Falha ao enviar mensagem para ${selectedLead.nome}. Verifique os logs do sistema.`, 'error', <AlertTriangle className="w-4 h-4 text-red-500" />);
            currentNodeId = null; // Stop flow on failure
          }
          break;
        }
        case 'wait': {
          const { duration, unit } = currentNode.data;
          addLog(`Ação 'Aguardar' por ${duration} ${unit} detectada. Pulando na simulação.`, 'info', <Clock className="w-4 h-4 text-orange-500" />);
          break;
        }
        case 'end':
          addLog('Fluxo finalizado com sucesso.', 'info', <CheckCircle className="w-4 h-4 text-purple-500" />);
          currentNodeId = null; // End of flow
          break;
        default:
          addLog(`Nó do tipo "${currentNode.type || 'indefinido'}" não suportado na simulação. Pulando.`, 'warning', <AlertTriangle className="w-4 h-4 text-yellow-500" />);
      }

      if (currentNodeId) {
        const edge = flow.edges.find(e => e.source === currentNodeId);
        currentNodeId = edge ? edge.target : null;
        if (!currentNodeId && currentNode.type !== 'end') {
            addLog('Nenhuma próxima ação encontrada. Finalizando simulação.', 'warning', <AlertTriangle className="w-4 h-4 text-yellow-500" />);
        }
      }
    }

    setIsSimulating(false);
  }, [selectedLead, flow, settings, sendMessage, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSimulating) onClose(); }}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Simular Fluxo de Follow-up (Modo Real)</DialogTitle>
          <DialogDescription className="text-orange-600 dark:text-orange-400 font-semibold">
            Atenção: Esta simulação executa ações REAIS. Mensagens serão ENVIADAS para o lead selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                  disabled={isSimulating}
                >
                  {selectedLead
                    ? leads.find((lead) => lead.id === selectedLead.id)?.nome
                    : "Selecione um lead..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar lead..." />
                  <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-48">
                      {leads.map((lead) => (
                        <CommandItem
                          key={lead.id}
                          value={lead.nome}
                          onSelect={() => {
                            setSelectedLead(lead);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedLead?.id === lead.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {lead.nome}
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={runSimulation} disabled={!selectedLead || isSimulating}>
              {isSimulating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isSimulating ? 'Executando...' : 'Executar Simulação'}
            </Button>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Log da Execução:</h4>
            <ScrollArea className="h-64 w-full rounded-md border p-4 bg-gray-50 dark:bg-gray-800">
              {simulationLog.length === 0 ? (
                <p className="text-sm text-gray-500">Aguardando início da execução...</p>
              ) : (
                simulationLog.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 mb-2 text-sm">
                    <div className="mt-1">{log.icon}</div>
                     <p className={cn(
                        "flex-1",
                        log.type === 'error' && 'text-red-600 dark:text-red-400',
                        log.type === 'success' && 'text-green-600 dark:text-green-400',
                        log.type === 'warning' && 'text-yellow-600 dark:text-yellow-400',
                      )}>
                        {log.message}
                      </p>
                    <span className="text-xs text-gray-400">{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimulateFlowModal;