import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  useReactFlow,
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Play, ArrowLeft, Bot, Clock, ToyBrick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import SendMessageNode from './nodes/SendMessageNode';
import WaitNode from './nodes/WaitNode';
import SimulateFlowModal from '@/components/modals/SimulateFlowModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/contexts/SettingsContext';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  sendMessage: SendMessageNode,
  wait: WaitNode,
};

const SidebarPanel = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </h3>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const ActionButton = ({ onDragStart, type, label, icon: Icon }) => (
  <div
    onDragStart={(event) => onDragStart(event, type)}
    draggable
    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-all transform hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:shadow-md border border-gray-200 dark:border-gray-600"
  >
    <Icon className="w-6 h-6 text-indigo-500" />
    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
  </div>
);

const FlowBuilder = ({ flow, onBack, onSave }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const onNodeDataChange = useCallback((nodeId, data) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  }, [setNodes]);

  useEffect(() => {
    if (flow) {
      const initialNodes = (flow.nodes || []).map(node => ({
        ...node,
        data: {
          ...node.data,
          onNodeDataChange,
          settings,
        },
      }));

      setFlowName(flow.name || 'Novo Fluxo');
      setNodes(initialNodes.length > 0 ? initialNodes : [
        { 
          id: 'start', 
          type: 'start', 
          position: { x: 150, y: 50 }, 
          data: { 
            onNodeDataChange, 
            settings,
            triggerType: flow.trigger_type || 'manual',
            triggerConfig: flow.trigger_config || {},
          } 
        },
        { id: 'end', type: 'end', position: { x: 150, y: 450 }, data: { onNodeDataChange } },
      ]);
      setEdges(flow.edges || []);
    }
  }, [flow, setNodes, setEdges, onNodeDataChange, settings]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#4f46e5' } }, eds)), [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    
    const newNode = {
      id: `${type}-${+new Date()}`,
      type,
      position,
      data: { onNodeDataChange, settings },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, onNodeDataChange, setNodes, settings]);

  const handleSave = async () => {
    if (!flowName.trim()) {
      toast({ variant: 'destructive', title: 'Nome do fluxo é obrigatório.' });
      return;
    }
  
    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();
  
    const startNode = currentNodes.find(n => n.type === 'start');
    if (!startNode) {
      toast({ variant: 'destructive', title: 'Fluxo inválido', description: 'O fluxo deve conter um nó de "Início".' });
      return;
    }
    if (!currentNodes.some(n => n.type === 'end')) {
      toast({ variant: 'destructive', title: 'Fluxo inválido', description: 'O fluxo deve conter um nó de "Fim".' });
      return;
    }
  
    const nodesToSave = currentNodes.map(({ data, ...node }) => {
      const { onNodeDataChange, settings, ...restData } = data || {};
      return { ...node, data: restData };
    });
  
    const flowData = {
      id: flow?.id,
      name: flowName,
      nodes: nodesToSave,
      edges: currentEdges,
      trigger_type: startNode.data.triggerType,
      trigger_config: startNode.data.triggerConfig,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };
  
    onSave(flowData);
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      <header className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-wrap gap-2 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Input
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="text-lg font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full sm:w-auto bg-transparent"
            placeholder="Nome do Fluxo"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsSimulating(true)} disabled={!flow}>
            <Play className="w-4 h-4 mr-2" />
            Simular
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </header>

      <div className="flex-grow flex">
        <div className="flex-grow h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-dots"
          >
            <Background variant="dots" gap={24} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="w-full md:w-96 bg-gray-50 dark:bg-gray-800/50 border-l border-gray-200 dark:border-gray-700 shadow-lg z-10">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <SidebarPanel title="Cards de Ação" icon={<ToyBrick className="text-gray-500" />}>
                <div className="space-y-3">
                  <ActionButton onDragStart={onDragStart} type="sendMessage" label="Enviar Mensagem" icon={Bot} />
                  <ActionButton onDragStart={onDragStart} type="wait" label="Aguardar" icon={Clock} />
                </div>
              </SidebarPanel>
            </div>
          </ScrollArea>
        </aside>
      </div>

      <AnimatePresence>
        {isSimulating && flow && (
          <SimulateFlowModal
            isOpen={isSimulating}
            onClose={() => setIsSimulating(false)}
            flow={{ ...flow, nodes: reactFlowInstance.getNodes(), edges: reactFlowInstance.getEdges() }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const FlowBuilderWrapper = (props) => (
  <ReactFlowProvider>
    <FlowBuilder {...props} />
  </ReactFlowProvider>
);

export default FlowBuilderWrapper;