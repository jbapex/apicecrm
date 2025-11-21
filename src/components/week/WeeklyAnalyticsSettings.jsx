import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const StatusMappingSelector = ({ title, description, allStatuses, selectedStatuses, onSelectionChange }) => {
  const [open, setOpen] = React.useState(false);
  const selectedSet = new Set(selectedStatuses);

  const handleSelect = (currentValue) => {
    const newSelected = new Set(selectedSet);
    if (newSelected.has(currentValue)) {
      newSelected.delete(currentValue);
    } else {
      newSelected.add(currentValue);
    }
    onSelectionChange(Array.from(newSelected));
  };
  
  const getStatusText = (status) => status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-gray-800">{title}</h4>
      <p className="text-xs text-gray-500">{description}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[38px] flex-wrap"
          >
            <div className="flex flex-wrap gap-1">
              {selectedStatuses.length > 0 ? (
                selectedStatuses.map((status) => (
                  <Badge variant="secondary" key={status} className="mr-1">
                    {getStatusText(status)}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500 font-normal">Selecione os status...</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar status..." />
            <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
            <CommandGroup>
              {allStatuses.map((status) => (
                <CommandItem
                  key={status.name}
                  value={status.name}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedSet.has(status.name) ? "opacity-100" : "opacity-0"
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
  );
};

const LabelEditor = ({ label, value, onChange }) => {
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <Label htmlFor={label} className="text-right text-sm">
        {label}
      </Label>
      <Input
        id={label}
        value={value}
        onChange={onChange}
        className="col-span-2 h-8"
      />
    </div>
  );
};

const WeeklyAnalyticsSettings = () => {
  const { settings, updateSettings, saving } = useSettings();
  const { toast } = useToast();
  const allStatuses = settings?.statuses || [];
  
  const mappings = settings?.analytics_mappings || {
    agendamento_statuses: [],
    comparecimento_statuses: [],
    venda_statuses: [],
  };

  const labels = settings?.analytics_labels || {
    agendamento: 'Agendamentos',
    comparecimento: 'Comparecimentos',
    venda: 'Vendas',
  };
  
  const [localLabels, setLocalLabels] = useState(labels);

  const handleMappingChange = (mappingKey, selected) => {
    const newMappings = { ...mappings, [mappingKey]: selected };
    updateSettings({ ...settings, analytics_mappings: newMappings }, false);
  };

  const handleLabelChange = (e, labelKey) => {
    setLocalLabels(prev => ({ ...prev, [labelKey]: e.target.value }));
  };

  const handleSaveLabels = () => {
    updateSettings({ ...settings, analytics_labels: localLabels });
    toast({ title: 'Rótulos salvos!', description: 'Os nomes das suas métricas foram atualizados.' });
  };


  return (
    <div className="p-4 bg-gray-50/50 space-y-8">
       <div>
         <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Mapeamento de Status</h3>
         <div className="space-y-6">
            <StatusMappingSelector
              title="Status da Métrica 1"
              description="Selecione os status que contam para a Métrica 1. Se nenhum for selecionado, o sistema considerará qualquer lead com data de agendamento."
              allStatuses={allStatuses}
              selectedStatuses={mappings.agendamento_statuses}
              onSelectionChange={(selected) => handleMappingChange('agendamento_statuses', selected)}
            />
            <StatusMappingSelector
              title="Status da Métrica 2"
              description="Selecione os status que contam para a Métrica 2."
              allStatuses={allStatuses}
              selectedStatuses={mappings.comparecimento_statuses}
              onSelectionChange={(selected) => handleMappingChange('comparecimento_statuses', selected)}
            />
            <StatusMappingSelector
              title="Status da Métrica 3"
              description="Selecione os status que contam para a Métrica 3."
              allStatuses={allStatuses}
              selectedStatuses={mappings.venda_statuses}
              onSelectionChange={(selected) => handleMappingChange('venda_statuses', selected)}
            />
         </div>
       </div>

       <div>
         <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Nomenclatura das Métricas</h3>
         <div className="space-y-4">
          <p className="text-xs text-gray-500">Personalize os nomes das etapas da sua análise para que correspondam à sua operação.</p>
           <LabelEditor label="Rótulo 1" value={localLabels.agendamento} onChange={(e) => handleLabelChange(e, 'agendamento')} />
           <LabelEditor label="Rótulo 2" value={localLabels.comparecimento} onChange={(e) => handleLabelChange(e, 'comparecimento')} />
           <LabelEditor label="Rótulo 3" value={localLabels.venda} onChange={(e) => handleLabelChange(e, 'venda')} />
           <div className="flex justify-end">
             <Button onClick={handleSaveLabels} disabled={saving}>
               {saving ? 'Salvando...' : 'Salvar Rótulos'}
             </Button>
           </div>
         </div>
       </div>
    </div>
  );
};

export default WeeklyAnalyticsSettings;