import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, Users, ShoppingBag } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import DataManagement from '@/components/settings/DataManagement';
import ListManager from '@/components/settings/ListManager';
import SourceManager from '@/components/settings/SourceManager';
import StatusManager from '@/components/settings/StatusManager';
import CustomFieldsSettings from '@/components/settings/CustomFieldsSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsContent from '@/pages/ProductsContent';

const GeneralSettings = ({ onImportClick }) => {
  const { settings, saving, handleSettingsChange, updateSettings, savedTemplates, saveAsDefault, saveAsGlobalDefault, deleteTemplate, exportBackup } = useSettings();
  const { toast } = useToast();

  const handleRestoreDefaults = (template) => {
    updateSettings(template);
    toast({
      title: "Padrões restaurados!",
      description: `As configurações do padrão "${template.name}" foram aplicadas.`,
    });
  };

  const handleSwitchChange = (checked) => {
    handleSettingsChange({ ...settings, enable_scheduling_time: checked });
  };

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Configurações</h1>
        {saving && <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />}
      </div>

      <DataManagement
        templates={savedTemplates}
        onRestore={handleRestoreDefaults}
        onSetGlobal={saveAsGlobalDefault}
        onDelete={deleteTemplate}
        onSave={saveAsDefault}
        onImportClick={onImportClick}
        onExportBackup={exportBackup}
      />

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><Clock className="mr-2 h-5 w-5 text-blue-500" />Configurações Gerais</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">Habilitar horário no agendamento</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Permite selecionar data e hora. Se desativado, apenas data.</p>
          </div>
          <Switch
            checked={settings.enable_scheduling_time}
            onCheckedChange={handleSwitchChange}
          />
        </div>
      </div>

      <CustomFieldsSettings />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StatusManager />
        <ListManager title="Vendedores" listName="sellers" placeholder="Ex: João Silva" icon={Users} />
      </div>

      <SourceManager />
    </div>
  );
};

const SettingsContent = ({ onImportClick }) => {
  const { loading, settings } = useSettings();

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <GeneralSettings onImportClick={onImportClick} />
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <ProductsContent />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SettingsContent;