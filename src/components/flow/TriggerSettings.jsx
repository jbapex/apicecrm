import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TriggerSettings = ({ triggerConfig, setTriggerConfig }) => {
  const { settings } = useSettings();
  const { type, config } = triggerConfig;

  const handleTypeChange = (newType) => {
    setTriggerConfig({ type: newType, config: {} }); // Reset config when type changes
  };

  const handleConfigValueChange = (key, value) => {
    const finalValue = value === '__any__' ? '' : value;
    setTriggerConfig(prev => ({ ...prev, config: { ...prev.config, [key]: finalValue } }));
  };

  const renderConfigOptions = () => {
    switch (type) {
      case 'status':
        return (
          <div className="space-y-2">
            <Label htmlFor="status-select">Quando o Status do Lead for</Label>
            <Select
              value={config?.status || ''}
              onValueChange={(value) => handleConfigValueChange('status', value)}
            >
              <SelectTrigger id="status-select">
                <SelectValue placeholder="Selecione um status..." />
              </SelectTrigger>
              <SelectContent>
                {(settings?.statuses || []).map(s => (
                  <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'tag':
        return (
          <div className="space-y-2">
            <Label htmlFor="tag-input">Quando a Tag for adicionada</Label>
            <Input
              id="tag-input"
              placeholder="Digite a tag exata"
              value={config?.tag || ''}
              onChange={(e) => handleConfigValueChange('tag', e.target.value)}
            />
          </div>
        );
      case 'origin':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="origin-select">Quando a Origem for</Label>
              <Select
                value={config?.origin || ''}
                onValueChange={(value) => {
                  setTriggerConfig(prev => ({ ...prev, config: { origin: value, sub_origin: '' } }));
                }}
              >
                <SelectTrigger id="origin-select">
                  <SelectValue placeholder="Selecione uma origem..." />
                </SelectTrigger>
                <SelectContent>
                  {(settings?.origins || []).map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {config?.origin && (settings?.sub_origins?.[config.origin] || []).length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="suborigin-select">E a Sub-Origem for (opcional)</Label>
                <Select
                  value={config.sub_origin || '__any__'}
                  onValueChange={(value) => handleConfigValueChange('sub_origin', value)}
                >
                  <SelectTrigger id="suborigin-select">
                    <SelectValue placeholder="Qualquer sub-origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Qualquer uma</SelectItem>
                    {(settings.sub_origins[config.origin] || []).map(so => (
                      <SelectItem key={so} value={so}>{so}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      case 'manual':
        return <p className="text-sm text-gray-500 dark:text-gray-400">Este fluxo será iniciado manualmente para cada lead.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="trigger-type-select">Tipo de Gatilho</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger id="trigger-type-select" className="w-full">
            <SelectValue placeholder="Selecione o tipo de gatilho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="status">Por Status do Lead</SelectItem>
            <SelectItem value="tag">Por Tag do Lead</SelectItem>
            <SelectItem value="origin">Por Origem do Lead</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {renderConfigOptions()}
    </div>
  );
};

export default TriggerSettings;