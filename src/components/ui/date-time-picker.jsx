import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export function DateTimePicker({ date, setDate, className }) {
  const [selectedDate, setSelectedDate] = useState(date ? new Date(date) : null);
  const [time, setTime] = useState(date ? format(new Date(date), 'HH:mm') : '00:00');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (date) {
      const d = new Date(date);
      if (isValid(d)) {
        setSelectedDate(d);
        setTime(format(d, 'HH:mm'));
      }
    } else {
      setSelectedDate(null);
      setTime('00:00');
    }
  }, [date]);

  const handleDateSelect = (day) => {
    if (!day) {
      setDate(null);
      return;
    }
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
    setSelectedDate(newDate);
    setDate(newDate);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hours, minutes);
        setDate(newDate);
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setDate(null);
    setSelectedDate(null);
    setTime('00:00');
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "dd/MM/yyyy HH:mm") : <span>Selecione uma data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          locale={ptBR}
        />
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between">
            <Input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="w-auto"
            />
            <Button variant="ghost" size="sm" onClick={handleClear}>Limpar</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}