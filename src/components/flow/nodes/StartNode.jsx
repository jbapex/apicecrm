import React from 'react';
import { Zap } from 'lucide-react';
import CustomNodeWrapper from './CustomNodeWrapper';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StartNode = ({ id, data }) => {
  const { 
    triggerType = 'manual', 
    triggerConfig = {}, 
    onNodeDataChange, 
    settings 
  } = data;

  const handleTypeChange = (newType) => {
    if (onNodeDataChange) {
      onNodeDataChange(id, { triggerType: newType, triggerConfig: {} });
    }
  };

  const handleConfigChange = (key, value) => {
    if (onNodeDataChange) {
      const newConfig = { ...triggerConfig, [key]: value };
      onNodeDataChange(id, { triggerConfig: newConfig });
    }
  };

  const renderConfigOptions = () => {
    switch (triggerType) {
      case 'status':
        return (
          <div className="space-y-2 nodrag">
            <Label htmlFor={`status-select-${id}`}>Quando o Status for</Label>
            <Select
              value={triggerConfig?.status || ''}
              onValueChange={(value) => handleConfigChange('status', value)}
            >
              <SelectTrigger id={`status-select-${id}`}>
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
          <div className="space-y-2 nodrag">
            <Label htmlFor={`tag-input-${id}`}>Quando a Tag for adicionada</Label>
            <Input
              id={`tag-input-${id}`}
              placeholder="Digite a tag exata"
              value={triggerConfig?.tag || ''}
              onChange={(e) => handleConfigChange('tag', e.target.value)}
            />
          </div>
        );
      case 'origin':
        return (
          <div className="space-y-4 nodrag">
            <div className="space-y-2">
              <Label htmlFor={`origin-select-${id}`}>Quando a Origem for</Label>
              <Select
                value={triggerConfig?.origin || ''}
                onValueChange={(value) => {
                  if (onNodeDataChange) {
                    onNodeDataChange(id, { triggerConfig: { origin: value, sub_origin: '' } });
                  }
                }}
              >
                <SelectTrigger id={`origin-select-${id}`}>
                  <SelectValue placeholder="Selecione uma origem..." />
                </SelectTrigger>
                <SelectContent>
                  {(settings?.origins || []).map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {triggerConfig?.origin && (settings?.sub_origins?.[triggerConfig.origin] || []).length > 0 && (
              <div className="space-y-2">
                <Label htmlFor={`suborigin-select-${id}`}>E a Sub-Origem for (opcional)</Label>
                <Select
                  value={triggerConfig.sub_origin || ''}
                  onValueChange={(value) => handleConfigChange('sub_origin', value)}
                >
                  <SelectTrigger id={`suborigin-select-${id}`}>
                    <SelectValue placeholder="Qualquer sub-origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer uma</SelectItem>
                    {(settings.sub_origins[triggerConfig.origin] || []).map(so => (
                      <SelectItem key={so} value={so}>{so}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      case 'manual':
        return <p className="text-sm text-gray-500 dark:text-gray-400">Este fluxo será iniciado manualmente.</p>;
      default:
        return null;
    }
  };

  return (
    <CustomNodeWrapper
      title="Gatilho Inicial"
      icon={<Zap className="w-5 h-5 text-yellow-500" />}
      hasTopHandle={false}
    >
      <div className="space-y-4">
        <div className="space-y-2 nodrag">
          <Label htmlFor={`trigger-type-select-${id}`}>Tipo de Gatilho</Label>
          <Select value={triggerType} onValueChange={handleTypeChange}>
            <SelectTrigger id={`trigger-type-select-${id}`} className="w-full">
              <SelectValue placeholder="Selecione o gatilho" />
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
    </CustomNodeWrapper>
  );
};

export default React.memo(StartNode);