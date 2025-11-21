import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Share2 } from 'lucide-react';
import EditableListItem from './EditableListItem';

const SourceManager = () => {
  const { settings, handleSettingsChange } = useSettings();
  const [newValues, setNewValues] = useState({
    origin: '',
    subOrigin: {},
  });

  const handleAddOrigin = () => {
    const value = newValues.origin.trim().toLowerCase();
    if (!value || (settings.origins || []).map(o => o.toLowerCase()).includes(value)) return;
    
    const newOrigins = [...(settings.origins || []), newValues.origin.trim()];
    const newSubOrigins = { ...(settings.sub_origins || {}), [newValues.origin.trim()]: [] };
    handleSettingsChange({ ...settings, origins: newOrigins, sub_origins: newSubOrigins });

    setNewValues(prev => ({ ...prev, origin: '' }));
  };

  const handleDeleteOrigin = (originToDelete) => {
    const { [originToDelete]: _, ...remainingSubOrigins } = settings.sub_origins;
    const newOrigins = settings.origins.filter(o => o !== originToDelete);
    handleSettingsChange({ ...settings, origins: newOrigins, sub_origins: remainingSubOrigins });
  };

  const handleUpdateOrigin = (oldOrigin, newOrigin) => {
    const newOrigins = settings.origins.map(o => o === oldOrigin ? newOrigin : o);
    const { [oldOrigin]: subOriginsToKeep, ...restSubOrigins } = settings.sub_origins;
    const newSubOrigins = { ...restSubOrigins, [newOrigin]: subOriginsToKeep };
    handleSettingsChange({ ...settings, origins: newOrigins, sub_origins: newSubOrigins });
  };

  const handleAddSubOrigin = (origin) => {
    const value = newValues.subOrigin[origin]?.trim().toLowerCase();
    if (!value || (settings.sub_origins?.[origin] || []).map(s => s.toLowerCase()).includes(value)) return;

    const newSubOriginsForOrigin = [...(settings.sub_origins?.[origin] || []), newValues.subOrigin[origin].trim()];
    const newSubOrigins = { ...settings.sub_origins, [origin]: newSubOriginsForOrigin };
    handleSettingsChange({ ...settings, sub_origins: newSubOrigins });

    setNewValues(prev => ({ ...prev, subOrigin: { ...prev.subOrigin, [origin]: '' } }));
  };

  const handleDeleteSubOrigin = (origin, subOriginToDelete) => {
    const newSubOriginsForOrigin = settings.sub_origins[origin].filter(so => so !== subOriginToDelete);
    const newSubOrigins = { ...settings.sub_origins, [origin]: newSubOriginsForOrigin };
    handleSettingsChange({ ...settings, sub_origins: newSubOrigins });
  };

  const handleUpdateSubOrigin = (origin, oldSubOrigin, newSubOrigin) => {
    const newSubOriginsForOrigin = settings.sub_origins[origin].map(so => so === oldSubOrigin ? newSubOrigin : so);
    const newSubOrigins = { ...settings.sub_origins, [origin]: newSubOriginsForOrigin };
    handleSettingsChange({ ...settings, sub_origins: newSubOrigins });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Share2 className="mr-2 h-5 w-5 text-blue-500" />Gerenciar Fontes</h2>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Adicionar Nova Origem</h3>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={newValues.origin}
            onChange={(e) => setNewValues(prev => ({ ...prev, origin: e.target.value }))}
            placeholder="Ex: Evento de Noivas"
            className="flex-grow"
            onKeyDown={(e) => e.key === 'Enter' && handleAddOrigin()}
          />
          <Button onClick={handleAddOrigin} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {(settings.origins || []).map((origin) => (
          <div key={origin} className="p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <EditableListItem
                item={origin}
                onUpdate={(oldValue, newValue) => handleUpdateOrigin(oldValue, newValue)}
                onDelete={() => handleDeleteOrigin(origin)}
              />
            </div>
            <div className="pl-4">
              <h5 className="text-sm font-medium text-gray-500 mb-2">Sub-Origens:</h5>
              <div className="flex flex-wrap gap-2 mb-2">
                {(settings.sub_origins?.[origin] || []).map((sub) => (
                  <EditableListItem
                    key={sub}
                    item={sub}
                    onUpdate={(oldValue, newValue) => handleUpdateSubOrigin(origin, oldValue, newValue)}
                    onDelete={() => handleDeleteSubOrigin(origin, sub)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newValues.subOrigin[origin] || ''}
                  onChange={(e) => setNewValues(prev => ({ ...prev, subOrigin: { ...prev.subOrigin, [origin]: e.target.value } }))}
                  placeholder="Adicionar sub-origem"
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubOrigin(origin)}
                />
                <Button onClick={() => handleAddSubOrigin(origin)} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceManager;