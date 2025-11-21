import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Check, ChevronsUpDown } from 'lucide-react';
import EditableListItem from './EditableListItem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const StatusManager = () => {
  const { settings, handleSettingsChange, getStatusText } = useSettings();
  const [inputValue, setInputValue] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const list = settings?.statuses || [];
  const attendanceTriggerStatuses = settings?.analytics_mappings?.attendance_trigger_statuses || [];

  const handleAddItem = () => {
    const value = inputValue.trim().toLowerCase();
    if (!value || list.some(item => item.name.toLowerCase() === value)) {
      setInputValue('');
      return;
    }
    
    const newItem = { name: value, color: '#cccccc' };
    const updatedList = [...list, newItem];
    handleSettingsChange({ ...settings, statuses: updatedList });
    setInputValue('');
  };

  const handleDeleteItem = (itemToDelete) => {
    const updatedList = list.filter(item => item.name !== itemToDelete.name);
    let updatedNoShowStatus = settings.noshow_status;
    if (itemToDelete.name === settings.noshow_status) {
      updatedNoShowStatus = null;
    }
    const updatedTriggerStatuses = attendanceTriggerStatuses.filter(s => s !== itemToDelete.name);
    handleSettingsChange({ 
      ...settings, 
      statuses: updatedList, 
      noshow_status: updatedNoShowStatus,
      analytics_mappings: {
        ...settings.analytics_mappings,
        attendance_trigger_statuses: updatedTriggerStatuses
      }
    });
  };

  const handleUpdateItem = (oldItem, newName) => {
    const updatedList = list.map(item => 
      item.name === oldItem.name ? { ...item, name: newName } : item
    );
    let updatedNoShowStatus = settings.noshow_status;
    if (oldItem.name === settings.noshow_status) {
      updatedNoShowStatus = newName;
    }
    const updatedTriggerStatuses = attendanceTriggerStatuses.map(s => s === oldItem.name ? newName : s);
    handleSettingsChange({ 
      ...settings, 
      statuses: updatedList, 
      noshow_status: updatedNoShowStatus,
      analytics_mappings: {
        ...settings.analytics_mappings,
        attendance_trigger_statuses: updatedTriggerStatuses
      }
    });
  };

  const handleColorChange = (itemToUpdate, newColor) => {
    const updatedList = list.map(item =>
      item.name === itemToUpdate.name ? { ...item, color: newColor } : item
    );
    handleSettingsChange({ ...settings, statuses: updatedList });
  };

  const handleNoShowStatusChange = (statusName) => {
    handleSettingsChange({ ...settings, noshow_status: statusName });
  };

  const handleTriggerStatusToggle = (statusName) => {
    const newSelection = attendanceTriggerStatuses.includes(statusName)
      ? attendanceTriggerStatuses.filter(s => s !== statusName)
      : [...attendanceTriggerStatuses, statusName];
    
    handleSettingsChange({
      ...settings,
      analytics_mappings: {
        ...settings.analytics_mappings,
        attendance_trigger_statuses: newSelection
      }
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Tag className="mr-2 h-5 w-5 text-blue-500" />Status dos Leads</h2>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ex: Contato inicial"
            className="flex-grow"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Button onClick={handleAddItem} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((item) => (
          <EditableListItem
            key={item.name}
            item={item}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          >
            <div className="relative">
              <input
                type="color"
                value={item.color}
                onChange={(e) => handleColorChange(item, e.target.value)}
                className="w-5 h-5 rounded-full cursor-pointer opacity-0 absolute inset-0"
              />
              <div
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </EditableListItem>
        ))}
      </div>
      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Configuração de No-Show</h3>
        <p className="text-sm text-gray-500 mb-3">Selecione o status que será usado para leads que não compareceram.</p>
        <Select value={settings?.noshow_status || ''} onValueChange={handleNoShowStatusChange}>
          <SelectTrigger className="w-full md:w-1/2">
            <SelectValue placeholder="Selecione um status para No-Show" />
          </SelectTrigger>
          <SelectContent>
            {list.length > 0 ? (
              list.map(status => (
                <SelectItem key={status.name} value={status.name}>{getStatusText(status.name)}</SelectItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">Nenhum status cadastrado.</div>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Confirmação de Comparecimento</h3>
        <p className="text-sm text-gray-500 mb-3">Selecione os status que, ao serem alterados, devem perguntar se o lead compareceu.</p>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full md:w-1/2 justify-between"
            >
              <span className="truncate">
                {attendanceTriggerStatuses.length > 0 
                  ? `${attendanceTriggerStatuses.length} status selecionado(s)`
                  : "Selecione os status..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Buscar status..." />
              <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
              <CommandGroup>
                {list.map((status) => (
                  <CommandItem
                    key={status.name}
                    value={status.name}
                    onSelect={() => handleTriggerStatusToggle(status.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        attendanceTriggerStatuses.includes(status.name) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {getStatusText(status.name)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default StatusManager;