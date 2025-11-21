import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const AddLeadModal = ({ isOpen, onClose, onSave }) => {
  const { settings } = useSettings();
  const { toast } = useToast();
  const customDateSettings = settings?.custom_fields_settings?.date_field || { is_active: false, label: '' };

  const getInitialState = () => ({
    nome: '',
    whatsapp: '',
    email: '',
    origem: '',
    sub_origem: '',
    data_entrada: new Date().toISOString().split('T')[0],
    agendamento: '',
    status: settings?.statuses?.[0]?.name || 'agendado',
    vendedor: '',
    valor: '',
    observacoes: '',
    custom_date_field: '',
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...getInitialState(),
        status: settings.statuses?.[0]?.name || 'agendado',
      }));
    }
  }, [settings, isOpen]);

  const handleValueChange = (name, value) => {
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'origem') {
        newState.sub_origem = '';
      }
      return newState;
    });
  };

  const handleChange = (e) => {
    handleValueChange(e.target.name, e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.whatsapp) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha pelo menos Nome e WhatsApp.",
      });
      return;
    }
    onSave({
      ...formData,
      valor: parseFloat(formData.valor) || 0,
      agendamento: formData.agendamento ? new Date(formData.agendamento).toISOString() : null,
      custom_date_field: formData.custom_date_field ? new Date(formData.custom_date_field).toISOString().split('T')[0] : null,
    });
  };

  if (!isOpen) return null;

  const availableSubOrigins = formData.origem && settings.sub_origins?.[formData.origem] ? settings.sub_origins[formData.origem] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para cadastrar um novo lead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="data_entrada">Data do Contato</Label>
            <Input id="data_entrada" name="data_entrada" type="date" value={formData.data_entrada} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="origem">Origem</Label>
            <Select name="origem" onValueChange={(value) => handleValueChange('origem', value)} value={formData.origem}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem..." />
              </SelectTrigger>
              <SelectContent>
                {settings.origins?.map(origin => <SelectItem key={origin} value={origin} className="capitalize">{origin}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sub_origem">Sub Origem</Label>
            <Select name="sub_origem" onValueChange={(value) => handleValueChange('sub_origem', value)} value={formData.sub_origem} disabled={availableSubOrigins.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a sub origem..." />
              </SelectTrigger>
              <SelectContent>
                {availableSubOrigins.map(sub => <SelectItem key={sub} value={sub} className="capitalize">{sub}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="agendamento">Agendamento</Label>
            <Input id="agendamento" name="agendamento" type={settings.enable_scheduling_time ? "datetime-local" : "date"} value={formData.agendamento} onChange={handleChange} />
          </div>
          {customDateSettings.is_active && (
            <div>
              <Label htmlFor="custom_date_field">{customDateSettings.label}</Label>
              <Input id="custom_date_field" name="custom_date_field" type="date" value={formData.custom_date_field} onChange={handleChange} />
            </div>
          )}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" onValueChange={(value) => handleValueChange('status', value)} value={formData.status}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status..." />
              </SelectTrigger>
              <SelectContent>
                {settings.statuses?.map(status => <SelectItem key={status.name} value={status.name} className="capitalize">{status.name.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vendedor">Vendedor</Label>
            <Select name="vendedor" onValueChange={(value) => handleValueChange('vendedor', value)} value={formData.vendedor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o vendedor..." />
              </SelectTrigger>
              <SelectContent>
                {settings.sellers?.map(seller => <SelectItem key={seller} value={seller}>{seller}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input id="valor" name="valor" type="number" placeholder="0.00" value={formData.valor} onChange={handleChange} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} placeholder="Adicione observações sobre o lead..." />
          </div>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar Lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadModal;