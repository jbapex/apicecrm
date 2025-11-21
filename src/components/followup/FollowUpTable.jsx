import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, History, MessageSquarePlus, MoreVertical, User } from 'lucide-react';
import StatusChanger from './StatusChanger';
import TaskChanger from './TaskChanger';
import { FlowActionsMenu } from './FlowActionsMenu';
import { add, differenceInDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDate as formatDateUtil } from '@/lib/dateUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, formatDateTime } from '@/lib/dateUtils';

const calculateDueDate = (lead, task) => {
  if (!task) return null;

  if (task.due_date_type === 'relative_to_schedule' && lead.agendamento) {
    return subDays(new Date(lead.agendamento), task.due_days);
  }
  
  if (task.due_date_type === 'relative_to_assignment' && lead.task_assigned_at) {
    return add(new Date(lead.task_assigned_at), { days: task.due_days });
  }

  return null;
};

const getTaskTemperatureClass = (dueDate) => {
  if (!dueDate) return '';
  const now = new Date();
  const daysDiff = differenceInDays(dueDate, now);

  if (daysDiff < 0) return 'bg-red-100/50 hover:bg-red-100/70'; // Overdue
  if (daysDiff <= 1) return 'bg-yellow-100/50 hover:bg-yellow-100/70'; // Due soon
  if (daysDiff <= 3) return 'bg-green-100/50 hover:bg-green-100/70'; // Due in a few days
  return ''; // No special color
};


const FollowUpTable = ({ leads, onUpdateLead, statuses, getStatusText, openModal, activeFlowsByLead, flowActions, tasks }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="table-header">
          <tr>
            <th className="px-4 py-3 text-left w-[180px]">Status</th>
            <th className="px-4 py-3 text-left w-[200px]">Tarefa</th>
            <th className="px-4 py-3 text-left w-[120px]">Vencimento</th>
            <th className="px-4 py-3 text-left">Nome</th>
            <th className="px-4 py-3 text-left w-[140px]">Telefone</th>
            <th className="px-4 py-3 text-left w-[140px]">Data de Entrada</th>
            <th className="px-4 py-3 text-left w-[180px]">Data de Agendamento</th>
            <th className="px-4 py-3 text-left w-[100px]">Valor</th>
            <th className="px-4 py-3 text-left min-w-[200px]">Observação</th>
            <th className="px-4 py-3 text-center w-[160px]">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map(lead => {
            const activeFlowInstance = activeFlowsByLead.get(lead.id);
            const task = tasks.find(t => t.id === lead.task_id);
            const dueDate = calculateDueDate(lead, task);
            const temperatureClass = getTaskTemperatureClass(dueDate);

            return (
              <tr key={lead.id} className={cn("relative transition-colors", temperatureClass)}>
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusChanger 
                    lead={lead} 
                    statuses={statuses} 
                    onUpdateLead={onUpdateLead} 
                    getStatusText={getStatusText}
                    tasks={tasks}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <TaskChanger
                    lead={lead}
                    tasks={tasks}
                    onUpdateLead={onUpdateLead}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                  {dueDate ? formatDateUtil(dueDate.toISOString()) : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                    <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={lead.profile_pic_url} alt={`Foto de ${lead.nome}`} />
                            <AvatarFallback>{lead.nome ? lead.nome.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                        </Avatar>
                        {lead.nome}
                    </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">{lead.whatsapp}</td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">{formatDate(lead.data_entrada)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">{formatDateTime(lead.agendamento)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">{lead.valor ? `R$ ${lead.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                <td className="px-4 py-4 whitespace-normal text-gray-600 max-w-xs truncate">{lead.observacoes || '-'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openModal(lead, 'comment')} title="Adicionar comentário">
                    <MessageSquarePlus className="w-4 h-4 text-purple-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openModal(lead, 'history')} title="Histórico de disparos">
                    <History className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openModal(lead, 'send')} title="Enviar mensagem">
                    <Send className="w-4 h-4 text-blue-500" />
                  </Button>
                  <FlowActionsMenu 
                    lead={lead}
                    activeFlowInstance={activeFlowInstance}
                    flowActions={flowActions}
                  >
                    <Button variant="ghost" size="icon" title="Ações do Fluxo">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </FlowActionsMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FollowUpTable;