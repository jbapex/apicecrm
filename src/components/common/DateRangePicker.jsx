import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const noop = () => {};

export const DateRangePicker = ({ onDateChange = noop, initialRange, defaultLabel = "Selecione o período" }) => {
  const [dateRange, setDateRange] = useState(initialRange || null);
  const [label, setLabel] = useState(defaultLabel);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (initialRange?.from && initialRange?.to) {
      const newLabel = `${format(initialRange.from, "dd/MM/yy")} - ${format(initialRange.to, "dd/MM/yy")}`;
      setLabel(newLabel);
      setDateRange(initialRange);
    } else {
      setLabel(defaultLabel);
      setDateRange(null);
    }
  }, [initialRange, defaultLabel]);

  const presets = [
    { label: 'Hoje', range: { from: startOfDay(new Date()), to: endOfDay(new Date()) } },
    { label: 'Ontem', range: { from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) } },
    { label: 'Últimos 7 dias', range: { from: subDays(new Date(), 6), to: endOfDay(new Date()) } },
    { label: 'Mês atual', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: 'Mês passado', range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } },
  ];

  const handlePresetClick = (preset) => {
    setDateRange(preset.range);
    setLabel(preset.label);
    onDateChange(preset.range);
    setIsOpen(false);
  };
  
  const handleDateSelect = (range) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      const newLabel = `${format(range.from, "dd/MM/yy")} - ${format(range.to, "dd/MM/yy")}`;
      setLabel(newLabel);
      onDateChange(range);
      setIsOpen(false);
    } else if (range?.from) {
       setLabel(`${format(range.from, "dd/MM/yy")} - ...`);
    } else {
       setLabel(defaultLabel);
       onDateChange(null);
    }
  };

  const clearFilter = () => {
    setDateRange(null);
    setLabel(defaultLabel);
    onDateChange(null);
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={"w-full sm:w-[260px] justify-start text-left font-normal"}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex" align="start">
        <div className="flex flex-col space-y-2 p-2 border-r">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              variant="ghost"
              className="justify-start"
            >
              {preset.label}
            </Button>
          ))}
           <Button
            onClick={clearFilter}
            variant="ghost"
            className="justify-start text-red-500 hover:text-red-600"
          >
            <X className="mr-2 h-4 w-4" />
            Todas as datas
          </Button>
        </div>
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={handleDateSelect}
          numberOfMonths={2}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
};