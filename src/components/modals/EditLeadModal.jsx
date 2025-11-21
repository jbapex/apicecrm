import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/contexts/SettingsContext';

const EditLeadModal = ({ lead, onClose, onSave }) => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState(lead);

  useEffect(() => {
    const formatForInput = (isoString) => {
      if (!isoString) return '';
      try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
      } catch (e) {
        return '';
      }
    };

    const initialData = {
      ...lead,
      data_entrada: lead.data_entrada ? lead.data_entrada.split('T')[0] : '',
      agendamento: formatForInput(lead.agendamento)
    };
    setFormData(initialData);
  }, [lead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value === 'sem_vendedor' ? null : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      ...formData,
      valor: parseFloat(formData.valor) || 0,
      agendamento: formData.agendamento ? new Date(formData.agendamento).toISOString() : null
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" type="text" required value={formData.nome || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input id="whatsapp" name="whatsapp" type="tel" required value={formData.whatsapp || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="data_entrada">Data do Contato</Label>
              <Input id="data_entrada" name="data_entrada" type="date" value={formData.data_entrada || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="origem">Origem</Label>
              <Select name="origem" value={formData.origem || ''} onValueChange={(value) => handleSelectChange('origem', value)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {settings.origins?.map(origin => <SelectItem key={origin} value={origin} className="capitalize">{origin}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sub_origem">Sub Origem</Label>
              <Select name="sub_origem" value={formData.sub_origem || ''} onValueChange={(value) => handleSelectChange('sub_origem', value)} disabled={!formData.origem || !settings.sub_origins?.[formData.origem] || settings.sub_origins?.[formData.origem].length === 0}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {formData.origem && settings.sub_origins?.[formData.origem]?.map(sub => <SelectItem key={sub} value={sub} className="capitalize">{sub}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="agendamento">Agendamento</Label>
              <Input id="agendamento" name="agendamento" type={settings.enable_scheduling_time ? "datetime-local" : "date"} value={formData.agendamento || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="vendedor">Vendedor</Label>
              <Select name="vendedor" value={formData.vendedor || 'sem_vendedor'} onValueChange={(value) => handleSelectChange('vendedor', value)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_vendedor">Sem Vendedor</SelectItem>
                  {settings.sellers?.map(seller => <SelectItem key={seller} value={seller}>{seller}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Status</Label>
            <Select name="status" value={formData.status || ''} onValueChange={(value) => handleSelectChange('status', value)}>
              <SelectTrigger><SelectValue placeholder="Selecione um status..." /></SelectTrigger>
              <SelectContent>
                {settings.statuses?.map(option => (
                  <SelectItem key={option.name} value={option.name} className="capitalize">
                    {option.name.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
             <Label htmlFor="valor">Valor da Venda</Label>
             <Input id="valor" name="valor" type="number" step="0.01" value={formData.valor || ''} onChange={handleChange} placeholder="0.00" />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" value={formData.observacoes || ''} onChange={handleChange} rows="3" />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditLeadModal;