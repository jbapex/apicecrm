import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/contexts/SettingsContext';
import { format, setHours, setMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ScheduleEditor = ({ lead, onUpdateLead, children }) => {
  const { settings } = useSettings();
  const [date, setDate] = useState(lead.agendamento ? parseISO(lead.agendamento) : null);
  const [time, setTime] = useState(lead.agendamento ? format(parseISO(lead.agendamento), 'HH:mm') : '09:00');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setDate(lead.agendamento ? parseISO(lead.agendamento) : null);
    setTime(lead.agendamento ? format(parseISO(lead.agendamento), 'HH:mm') : '09:00');
  }, [lead.agendamento]);

  const handleSave = () => {
    if (date) {
      let newDate = date;
      if (settings.enable_scheduling_time) {
        const [hours, minutes] = time.split(':').map(Number);
        newDate = setMinutes(setHours(date, hours), minutes);
      }
      onUpdateLead(lead.id, { agendamento: newDate.toISOString() });
    } else {
      onUpdateLead(lead.id, { agendamento: null });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setDate(null);
    onUpdateLead(lead.id, { agendamento: null });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-md transition-colors">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={ptBR}
        />
        {settings.enable_scheduling_time && date && (
          <div className="p-2 border-t border-border">
            <label className="text-sm font-medium">Horário</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1"
            />
          </div>
        )}
        <div className="p-2 border-t border-border flex justify-between">
          <Button variant="ghost" onClick={handleClear}>Limpar</Button>
          <Button onClick={handleSave} disabled={!date}>Salvar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ScheduleEditor;