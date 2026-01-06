import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from './SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const systemDefaultSettings = {
  name: 'Padrão Original do Sistema',
  origins: ['instagram', 'facebook', 'whatsapp', 'indicacao', 'site'],
  sub_origins: {
    instagram: ['feed', 'stories', 'reels'],
    facebook: ['feed', 'stories'],
    whatsapp: [],
    indicacao: [],
    site: []
  },
  statuses: [
    { name: 'agendado', color: '#3b82f6' },
    { name: 'compareceu', color: '#f97316' },
    { name: 'vendeu', color: '#22c55e' },
    { name: 'nao_compareceu', color: '#ef4444' },
  ],
  sellers: ['Ana Costa', 'Carla Lima'],
  enable_scheduling_time: true,
  is_global: true,
  apicebot_url: '',
  apicebot_token: '',
  noshow_status: 'nao_compareceu',
  custom_fields_settings: {
    date_field: {
      is_active: true,
      label: 'Data de Venda'
    }
  },
  analytics_mappings: {
    agendamento_statuses: [],
    comparecimento_statuses: [],
    venda_statuses: [],
    attendance_trigger_statuses: [],
  },
  analytics_labels: {
    agendamento: 'Agendamentos',
    comparecimento: 'Comparecimentos',
    venda: 'Vendas',
  }
};

const getStatusText = (status) => {
    return status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
};

export const SettingsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let activeSettings = null;
      let allTemplates = [];

      const { data: globalDefaultData, error: globalDefaultError } = await supabase
        .from('system_default_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (globalDefaultError) throw new Error(`Buscando padrão global: ${globalDefaultError.message}`);
      
      const globalDefault = globalDefaultData?.[0] ? { ...systemDefaultSettings, ...globalDefaultData[0], is_global: true } : systemDefaultSettings;
      allTemplates.push(globalDefault);

      const { data: userSettingsData, error: userSettingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userSettingsError) throw new Error(`Buscando configs do usuário: ${userSettingsError.message}`);

      activeSettings = userSettingsData || globalDefault;
      
      // Ensure custom fields settings exist
      if (!activeSettings.custom_fields_settings) {
        activeSettings.custom_fields_settings = systemDefaultSettings.custom_fields_settings;
      }
      if (activeSettings.custom_fields_settings.date_field.label === 'Data Personalizada' || !activeSettings.custom_fields_settings.date_field.label) {
        activeSettings.custom_fields_settings.date_field.label = 'Data de Venda';
      }
      activeSettings.custom_fields_settings.date_field.is_active = true;

      if (!activeSettings.analytics_mappings) {
        activeSettings.analytics_mappings = systemDefaultSettings.analytics_mappings;
      }
      if (!activeSettings.analytics_labels) {
        activeSettings.analytics_labels = systemDefaultSettings.analytics_labels;
      }
      if (!activeSettings.analytics_mappings.attendance_trigger_statuses) {
        activeSettings.analytics_mappings.attendance_trigger_statuses = [];
      }

      const { data: userTemplatesData, error: userTemplatesError } = await supabase
        .from('user_default_settings')
        .select('id, name, origins, sub_origins, statuses, sellers, enable_scheduling_time, user_id, noshow_status, custom_fields_settings, analytics_mappings, analytics_labels')
        .eq('user_id', user.id);
      
      if (userTemplatesError) throw new Error(`Buscando templates do usuário: ${userTemplatesError.message}`);

      allTemplates = [...allTemplates, ...userTemplatesData];
      
      setSettings(activeSettings);
      setSavedTemplates(allTemplates);

    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: "Erro ao carregar configurações", description: error.message, variant: "destructive" });
      if (!settings) {
        setSettings(systemDefaultSettings);
        setSavedTemplates([systemDefaultSettings]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchSettings();
      } else {
        setSettings(systemDefaultSettings);
        setSavedTemplates([systemDefaultSettings]);
        setLoading(false);
      }
    }
  }, [user, authLoading, fetchSettings]);

  const updateSetting = async (key, value) => {
    if (!user) return;
    setSaving(true);
    setSettings(prev => ({...prev, [key]: value}));
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, [key]: value }, { onConflict: 'user_id' });

    if (error) {
        toast({ title: 'Erro ao salvar configuração', description: error.message, variant: 'destructive' });
    }
    setSaving(false);
  };
  
  const updateSettings = async (newSettings, showToast = true) => {
    if (!user) {
      const updated = { ...settings, ...newSettings, name: settings?.name || 'Configuração Ativa' };
      // Ensure custom fields settings are active
      if (!updated.custom_fields_settings) updated.custom_fields_settings = systemDefaultSettings.custom_fields_settings;
      updated.custom_fields_settings.date_field.is_active = true;
      updated.custom_fields_settings.date_field.label = 'Data de Venda';
      setSettings(updated);
      return;
    }
  
    setSaving(true);
    const settingsWithCurrentName = { ...settings, ...newSettings };
    // Force active and label
    if (settingsWithCurrentName.custom_fields_settings) {
        settingsWithCurrentName.custom_fields_settings.date_field.is_active = true;
        settingsWithCurrentName.custom_fields_settings.date_field.label = 'Data de Venda';
    } else {
        settingsWithCurrentName.custom_fields_settings = { date_field: { is_active: true, label: 'Data de Venda' } };
    }
    
    setSettings(settingsWithCurrentName);
    
    const settingsToSave = { ...newSettings };
    if (settingsWithCurrentName.custom_fields_settings) {
      settingsToSave.custom_fields_settings = settingsWithCurrentName.custom_fields_settings;
    }
    delete settingsToSave.name;
    delete settingsToSave.id;
    delete settingsToSave.is_global;
    delete settingsToSave.user_id;

    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: user.id,
        ...settingsToSave,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });

    setSaving(false);
    if (error) {
      if (showToast) toast({ title: "Erro ao salvar configurações", description: error.message, variant: "destructive" });
      await fetchSettings();
      return false;
    }
    return true;
  };
  
  const handleSettingsChange = (newSettings) => {
    updateSettings(newSettings);
  };

  const saveAsDefault = async (templateName) => {
    if (!user || !settings || !templateName) return;
    setSaving(true);

    const settingsToSave = { ...settings };
    delete settingsToSave.name;
    delete settingsToSave.id;
    delete settingsToSave.is_global;
    delete settingsToSave.apicebot_url;
    delete settingsToSave.apicebot_token;
    delete settingsToSave.generic_webhook_secret;
    delete settingsToSave.tintim_webhook_secret;
    delete settingsToSave.company_logo_url;

    const { error } = await supabase
      .from('user_default_settings')
      .upsert({
        user_id: user.id,
        name: templateName,
        ...settingsToSave,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, name' });
    
    if (error) {
      toast({ title: "Erro ao salvar padrão pessoal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `O padrão "${templateName}" foi salvo.` });
      await fetchSettings();
    }
    setSaving(false);
  };

  const saveAsGlobalDefault = async (template) => {
    if (!user || !template) return;
    setSaving(true);
  
    const { id, user_id, is_global, ...settingsToSave } = template;
  
    const { data: existing, error: selectError } = await supabase
      .from('system_default_settings')
      .select('id')
      .eq('name', settingsToSave.name)
      .maybeSingle();
  
    if (selectError) {
      toast({ title: "Erro ao verificar padrão global", description: selectError.message, variant: "destructive" });
      setSaving(false);
      return;
    }
  
    const { error } = await supabase
      .from('system_default_settings')
      .upsert({
        ...settingsToSave,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'name' });
  
    if (error) {
      toast({ title: "Erro ao definir padrão global", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `"${settingsToSave.name}" agora é o padrão global.` });
      await fetchSettings();
    }
    setSaving(false);
  };
  
  const deleteTemplate = async (template) => {
    if (!user || !template.id) return;
    setSaving(true);
    
    const { error } = await supabase
        .from('user_default_settings')
        .delete()
        .eq('id', template.id);
        
    if (error) {
        toast({ title: "Erro ao excluir padrão", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Sucesso!", description: `O padrão "${template.name}" foi excluído.` });
        await fetchSettings();
    }
    setSaving(false);
  }

  const exportBackup = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para exportar dados.", variant: "destructive" });
      return;
    }
    toast({ title: "Iniciando exportação...", description: "Preparando seus dados para backup. Isso pode levar um momento." });
    setSaving(true);
  
    try {
      // Lista completa de tabelas para backup
      const tablesToExport = [
        'leads',
        'staged_leads',
        'investments',
        'lead_comments',
        'message_history',
        'user_settings',
        'user_default_settings',
        'products',
        'flows',
        'flow_logs'
      ];
      
      const backupData = {
        metadata: {
          exportDate: new Date().toISOString(),
          userId: user.id,
          userEmail: user.email,
          version: '1.0.0'
        },
        tables: {}
      };
  
      for (const table of tablesToExport) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', user.id);
          
          if (error) {
            console.warn(`Aviso ao exportar ${table}:`, error.message);
            backupData.tables[table] = { error: error.message, data: [] };
          } else {
            backupData.tables[table] = data || [];
          }
        } catch (tableError) {
          console.warn(`Erro ao exportar tabela ${table}:`, tableError);
          backupData.tables[table] = { error: tableError.message, data: [] };
        }
      }
  
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `apice_crm_backup_${timestamp}_${user.id.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
  
      const totalRecords = Object.values(backupData.tables).reduce((sum, table) => {
        return sum + (Array.isArray(table) ? table.length : (table.data?.length || 0));
      }, 0);
  
      toast({ 
        title: "Backup completo!", 
        description: `Seu arquivo de backup foi baixado com sucesso. ${totalRecords} registros exportados.` 
      });
    } catch (error) {
      console.error("Erro ao exportar backup:", error);
      toast({ title: "Erro no Backup", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const value = {
    settings,
    loading,
    saving,
    fetchSettings,
    handleSettingsChange,
    updateSettings,
    updateSetting,
    savedTemplates,
    saveAsDefault,
    saveAsGlobalDefault,
    deleteTemplate,
    exportBackup,
    getStatusText,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};