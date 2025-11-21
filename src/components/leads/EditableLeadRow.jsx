import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useProducts } from '@/hooks/useProducts';
import { Check, X } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/input-currency';

const EditableLeadRow = ({ lead, onSave, onCancel }) => {
  const { settings } = useSettings();
  const { products } = useProducts();
  const [formData, setFormData] = useState({});
  const customDateSettings = settings?.custom_fields_settings?.date_field || { is_active: false, label: '' };

  useEffect(() => {
    const formatForInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        if (settings.enable_scheduling_time) {
            return localDate.toISOString().slice(0, 16);
        }
        return localDate.toISOString().split('T')[0];
    };
  
    setFormData({
      ...lead,
      data_entrada: lead.data_entrada ? lead.data_entrada.split('T')[0] : '',
      agendamento: formatForInput(lead.agendamento),
      custom_date_field: lead.custom_date_field ? lead.custom_date_field.split('T')[0] : '',
      observacoes: lead.observacoes || '',
      product_id: lead.product_id || '',
      valor: lead.valor || 0,
    });
  }, [lead, settings.enable_scheduling_time]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave({
      id: formData.id,
      nome: formData.nome,
      whatsapp: formData.whatsapp,
      email: formData.email,
      data_entrada: formData.data_entrada ? new Date(formData.data_entrada).toISOString().split('T')[0] : null,
      origem: formData.origem,
      sub_origem: formData.sub_origem,
      agendamento: formData.agendamento ? new Date(formData.agendamento).toISOString() : null,
      status: formData.status,
      vendedor: formData.vendedor,
      product_id: formData.product_id || null,
      valor: parseFloat(formData.valor) || 0,
      observacoes: formData.observacoes,
      custom_date_field: formData.custom_date_field ? new Date(formData.custom_date_field).toISOString().split('T')[0] : null,
    });
  };

  return (
    <td colSpan="10" className="p-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        
        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
            <input type="text" name="nome" placeholder="Nome do lead" value={formData.nome || ''} onChange={handleChange} className="input-field-table w-full" />
        </div>
        
        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
            <input type="text" name="whatsapp" placeholder="WhatsApp" value={formData.whatsapp || ''} onChange={handleChange} className="input-field-table w-full" />
        </div>
        
        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" name="email" placeholder="Email" value={formData.email || ''} onChange={handleChange} className="input-field-table w-full" />
        </div>

        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Entrada</label>
            <input type="date" name="data_entrada" value={formData.data_entrada || ''} onChange={handleChange} className="input-field-table w-full" />
        </div>
        
        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origem</label>
            <select name="origem" value={formData.origem || ''} onChange={handleChange} className="input-field-table w-full capitalize">
                <option value="">Origem...</option>
                {settings.origins?.map(origin => <option key={origin} value={origin}>{origin}</option>)}
            </select>
        </div>
        
        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub Origem</label>
            <select name="sub_origem" value={formData.sub_origem || ''} onChange={handleChange} className="input-field-table w-full capitalize" disabled={!formData.origem || !settings.sub_origins?.[formData.origem] || settings.sub_origins?.[formData.origem].length === 0}>
                <option value="">Sub Origem...</option>
                {formData.origem && settings.sub_origins?.[formData.origem]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
        </div>

        {customDateSettings.is_active && (
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{customDateSettings.label}</label>
            <input type="date" name="custom_date_field" value={formData.custom_date_field || ''} onChange={handleChange} className="input-field-table w-full" />
          </div>
        )}

        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agendamento</label>
            <input type={settings.enable_scheduling_time ? "datetime-local" : "date"} name="agendamento" value={formData.agendamento || ''} onChange={handleChange} className="input-field-table w-full" />
        </div>

        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select name="status" value={formData.status || ''} onChange={handleChange} className="input-field-table w-full capitalize">
                {settings.statuses?.map(status => <option key={status.name} value={status.name}>{status.name.replace(/_/g, ' ')}</option>)}
            </select>
        </div>

        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendedor</label>
            <select name="vendedor" value={formData.vendedor || ''} onChange={handleChange} className="input-field-table w-full capitalize">
                <option value="">Vendedor...</option>
                {settings.sellers?.map(seller => <option key={seller} value={seller}>{seller}</option>)}
            </select>
        </div>
        
        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto</label>
            <select name="product_id" value={formData.product_id || ''} onChange={handleChange} className="input-field-table w-full capitalize">
                <option value="">Produto...</option>
                {products?.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
        </div>

        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
            <CurrencyInput name="valor" placeholder="R$ 0,00" value={formData.valor} onChange={handleChange} className="input-field-table w-full" />
        </div>
        
        <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <textarea name="observacoes" placeholder="Adicione observações sobre o lead..." value={formData.observacoes || ''} onChange={handleChange} className="input-field-table w-full" rows="2" />
        </div>

        <div className="col-span-full flex items-end justify-end gap-2">
            <Button onClick={onCancel} variant="ghost" size="sm">
                <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} size="sm" className="bg-green-500 hover:bg-green-600">
                <Check className="h-4 w-4 mr-1" /> Salvar
            </Button>
        </div>
      </div>
    </td>
  );
};

export default EditableLeadRow;