import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from 'lucide-react';
import AttendanceConfirmationModal from '@/components/modals/AttendanceConfirmationModal';
import { useSettings } from '@/contexts/SettingsContext';

const StatusChanger = ({ lead, statuses, onUpdateLead, getStatusText, tasks }) => {
  const [open, setOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [confirmationType, setConfirmationType] = useState('attendance');
  const { settings } = useSettings();

  const attendanceTriggerStatuses = settings?.analytics_mappings?.attendance_trigger_statuses || [];
  const schedulingTriggerStatuses = settings?.analytics_mappings?.agendamento_statuses || [];
  const noShowStatus = settings?.noshow_status;

  const handleStatusSelect = (newStatus) => {
    if (newStatus === lead.status) {
      setOpen(false);
      return;
    }

    setSelectedStatus(newStatus);

    if (attendanceTriggerStatuses.includes(lead.status)) {
      if (lead.attended) {
        setConfirmationType('reattendance');
      } else {
        setConfirmationType('attendance');
      }
      setShowConfirmation(true);
    } else if (schedulingTriggerStatuses.includes(newStatus)) {
      if (lead.agendamento) {
        setConfirmationType('rescheduling');
      } else {
        setConfirmationType('scheduling');
      }
      setShowConfirmation(true);
    } else {
      handleStatusChange(newStatus);
    }
    setOpen(false);
  };

  const handleConfirmation = (action) => {
    let updates = { 
      status: selectedStatus, 
      updated_at: new Date().toISOString() 
    };

    if (action === 'wrong-status') {
      setShowConfirmation(false);
      setSelectedStatus(null);
      return;
    }

    if (confirmationType === 'attendance' || confirmationType === 'reattendance') {
      if (action === 'attended') { // Sim, Compareceu / Sim, Registrar Novo
        updates.attended = true;
      } else if (action === 'no-show') { // Não Compareceu / Não, Manter Antigo
        if (confirmationType === 'attendance') {
          updates.status = noShowStatus || 'nao_compareceu';
          updates.attended = false;
        } else { // reattendance: just change status, don't alter `attended`
          // 'no-show' in reattendance means "don't proceed", which is handled by 'wrong-status'
          // This path is for "Não, Manter Antigo" which means cancel the action.
           setShowConfirmation(false);
           setSelectedStatus(null);
           return;
        }
      }
    } else if (confirmationType === 'scheduling') {
      if (action === 'attended') { // "Sim, Agendar Agora"
        updates.agendamento = new Date().toISOString();
      }
    } else if (confirmationType === 'rescheduling') {
      if (action === 'attended') { // "Sim, Substituir"
        updates.agendamento = new Date().toISOString();
      }
    }
    
    const defaultTask = tasks.find(t => t.default_for_status === updates.status);
    if (defaultTask) {
      updates.task_id = defaultTask.id;
      updates.task_assigned_at = new Date().toISOString();
    }

    onUpdateLead(lead.id, updates);
    setShowConfirmation(false);
    setSelectedStatus(null);
  };

  const handleStatusChange = (newStatus) => {
    const updates = { 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    };

    const defaultTask = tasks.find(t => t.default_for_status === newStatus);
    if (defaultTask) {
      updates.task_id = defaultTask.id;
      updates.task_assigned_at = new Date().toISOString();
    }

    onUpdateLead(lead.id, updates);
  };

  const currentStatusObj = statuses.find(s => s.name === lead.status) || {};

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-[180px] justify-between"
          >
            <span className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: currentStatusObj.color || '#cccccc' }}
              />
              <span className="truncate">{getStatusText(lead.status)}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-white">
          <Command>
            <CommandInput placeholder="Buscar status..." />
            <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
            <CommandGroup>
              {statuses.map((status) => (
                <CommandItem
                  key={status.name}
                  value={status.name}
                  onSelect={() => handleStatusSelect(status.name)}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      lead.status === status.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: status.color || '#cccccc' }}
                  />
                  {getStatusText(status.name)}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <AttendanceConfirmationModal
        isOpen={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmation}
        type={confirmationType}
      />
    </>
  );
};

export default StatusChanger;