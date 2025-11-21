import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';

const DateEditor = ({ lead, onUpdateLead, field, children }) => {
  const [date, setDate] = useState(lead[field] ? new Date(lead[field]) : null);
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (selectedDate) => {
    if (selectedDate) {
      // Adjust for timezone offset to store as 'YYYY-MM-DD'
      const timezoneOffset = selectedDate.getTimezoneOffset() * 60000;
      const localDate = new Date(selectedDate.getTime() - timezoneOffset);
      const dateString = localDate.toISOString().split('T')[0];
      
      setDate(selectedDate);
      onUpdateLead(lead.id, { [field]: dateString });
    } else {
      setDate(null);
      onUpdateLead(lead.id, { [field]: null });
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={ptBR}
        />
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => handleDateSelect(null)}>
            Limpar Data
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateEditor;