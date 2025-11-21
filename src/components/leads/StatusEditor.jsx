import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AttendanceConfirmationModal from '@/components/modals/AttendanceConfirmationModal';

const StatusEditor = ({ lead, onUpdateLead, getStatusIcon, getStatusText }) => {
  const { settings } = useSettings();
  const [currentStatus, setCurrentStatus] = useState(lead.status);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [confirmationType, setConfirmationType] = useState('attendance');

  const attendanceTriggerStatuses = settings?.analytics_mappings?.attendance_trigger_statuses || [];
  const schedulingTriggerStatuses = settings?.analytics_mappings?.agendamento_statuses || [];
  const noShowStatus = settings?.noshow_status;

  const getStatusColor = (statusName) => {
    const status = settings.statuses?.find(s => s.name === statusName);
    return status ? status.color : '#cccccc';
  };

  const handleDirectStatusChange = (newStatus) => {
    if (newStatus && newStatus !== currentStatus) {
      setCurrentStatus(newStatus);
      onUpdateLead(lead.id, { status: newStatus, updated_at: new Date().toISOString() });
    }
  };

  const handleStatusSelect = (newStatus) => {
    if (newStatus === lead.status) return;

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
      handleDirectStatusChange(newStatus);
    }
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
    
    onUpdateLead(lead.id, updates);
    setCurrentStatus(updates.status);
    setShowConfirmation(false);
    setSelectedStatus(null);
  };

  return (
    <>
      <div className="w-full">
        <Select value={currentStatus} onValueChange={handleStatusSelect}>
          <SelectTrigger
            className="h-8 text-xs focus:ring-0 focus:ring-offset-0 capitalize text-white font-semibold"
            style={{
              backgroundColor: getStatusColor(currentStatus),
              borderColor: 'transparent',
              boxShadow: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SelectValue>
              <div className="flex items-center">
                {getStatusIcon(currentStatus)}
                <span className="ml-1.5">{getStatusText(currentStatus)}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {settings.statuses?.map((status) => (
              <SelectItem key={status.name} value={status.name} className="capitalize">
                {getStatusText(status.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <AttendanceConfirmationModal
        isOpen={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmation}
        type={confirmationType}
      />
    </>
  );
};

export default StatusEditor;