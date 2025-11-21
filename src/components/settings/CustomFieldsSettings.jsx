import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarHeart } from 'lucide-react';

const CustomFieldsSettings = () => {
  const { settings, handleSettingsChange } = useSettings();

  const customFieldSettings = settings?.custom_fields_settings?.date_field || {
    is_active: false,
    label: 'Data Personalizada',
  };

  const handleActiveChange = (checked) => {
    handleSettingsChange({
      ...settings,
      custom_fields_settings: {
        ...settings.custom_fields_settings,
        date_field: {
          ...customFieldSettings,
          is_active: checked,
        },
      },
    });
  };

  const handleLabelChange = (e) => {
    handleSettingsChange({
      ...settings,
      custom_fields_settings: {
        ...settings.custom_fields_settings,
        date_field: {
          ...customFieldSettings,
          label: e.target.value,
        },
      },
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
        <CalendarHeart className="mr-2 h-5 w-5 text-pink-500" />
        Campo de Data Personalizado
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">Ativar campo de data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Exibe uma coluna de data extra para os leads.</p>
          </div>
          <Switch
            checked={customFieldSettings.is_active}
            onCheckedChange={handleActiveChange}
          />
        </div>
        {customFieldSettings.is_active && (
          <div>
            <Label htmlFor="custom-date-label">Nome do campo</Label>
            <Input
              id="custom-date-label"
              value={customFieldSettings.label}
              onChange={handleLabelChange}
              placeholder="Ex: Data do Casamento"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFieldsSettings;