import React from 'react';
import { motion } from 'framer-motion';
import { Send, History, MessageSquarePlus, MoreVertical, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlowActionsMenu } from './FlowActionsMenu';
import { cn } from '@/lib/utils';
import { add, differenceInDays, subDays } from 'date-fns';
import { formatDate as formatDateUtil } from '@/lib/dateUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  if (!dueDate) return 'bg-white';
  const now = new Date();
  const daysDiff = differenceInDays(dueDate, now);

  if (daysDiff < 0) return 'bg-red-100'; // Overdue
  if (daysDiff <= 1) return 'bg-yellow-100'; // Due soon
  if (daysDiff <= 3) return 'bg-green-100'; // Due in a few days
  return 'bg-white'; // No special color
};


const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start text-sm">
    <p className="font-medium text-gray-500">{label}:</p>
    <p className="text-gray-800 text-right">{value}</p>
  </div>
);

export const FollowUpCard = ({ lead, StatusChangerComponent, TaskChangerComponent, onUpdateLead, statuses, getStatusText, openModal, formatDate, formatDateTime, activeFlowInstance, flowActions, tasks }) => {
  const task = tasks.find(t => t.id === lead.task_id);
  const dueDate = calculateDueDate(lead, task);
  const temperatureClass = getTaskTemperatureClass(dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn("rounded-lg p-4 card-shadow space-y-4 transition-colors", temperatureClass)}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="flex items-center gap-3 flex-grow">
          <Avatar className="h-12 w-12">
              <AvatarImage src={lead.profile_pic_url} alt={`Foto de ${lead.nome}`} />
              <AvatarFallback>{lead.nome ? lead.nome.charAt(0).toUpperCase() : <User />}</AvatarFallback>
          </Avatar>
          <h3 className="font-bold text-lg text-gray-900 flex-grow">{lead.nome}</h3>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <StatusChangerComponent 
            lead={lead} 
            statuses={statuses} 
            onUpdateLead={onUpdateLead} 
            getStatusText={getStatusText}
            tasks={tasks}
          />
          <TaskChangerComponent
            lead={lead}
            tasks={tasks}
            onUpdateLead={onUpdateLead}
          />
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <InfoRow label="Telefone" value={lead.whatsapp || '-'} />
        {dueDate && <InfoRow label="Venc. Tarefa" value={formatDateUtil(dueDate.toISOString())} />}
        <InfoRow label="Data de Entrada" value={formatDate(lead.data_entrada)} />
        <InfoRow label="Agendamento" value={formatDateTime(lead.agendamento)} />
        <InfoRow label="Valor" value={lead.valor ? `R$ ${lead.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'} />
      </div>

      {lead.observacoes && (
        <div className="border-t pt-3">
            <p className="text-sm font-medium text-gray-500 mb-1">Observação:</p>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{lead.observacoes}</p>
        </div>
      )}

      <div className="flex justify-end space-x-2 border-t pt-3">
        <Button variant="outline" size="sm" onClick={() => openModal(lead, 'comment')} className="flex-1 sm:flex-none">
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Comentar
        </Button>
        <Button variant="outline" size="icon" onClick={() => openModal(lead, 'history')} title="Histórico de disparos">
          <History className="w-4 h-4 text-gray-600" />
        </Button>
        <Button variant="default" size="icon" onClick={() => openModal(lead, 'send')} title="Enviar mensagem">
          <Send className="w-4 h-4" />
        </Button>
        <FlowActionsMenu 
          lead={lead}
          activeFlowInstance={activeFlowInstance}
          flowActions={flowActions}
        >
          <Button variant="outline" size="icon" title="Ações do Fluxo">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </FlowActionsMenu>
      </div>
    </motion.div>
  );
};