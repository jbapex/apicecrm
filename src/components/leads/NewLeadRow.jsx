import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { useProducts } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const NewLeadRow = ({ onAddLead }) => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const { products } = useProducts();
  const [showObsModal, setShowObsModal] = useState(false);
  const customDateSettings = settings?.custom_fields_settings?.date_field || { is_active: false, label: '' };
  
  const getInitialState = () => ({
    nome: '',
    whatsapp: '',
    email: '',
    origem: '',
    sub_origem: '',
    data_entrada: new Date().toISOString().split('T')[0],
    agendamento: '',
    status: settings.statuses?.[0]?.name || 'agendado',
    vendedor: '',
    valor: '',
    observacoes: '',
    product_id: '',
    custom_date_field: '',
  });

  const [newLead, setNewLead] = useState(getInitialState());

  const handleNewLeadChange = (e) => {
    const { name, value } = e.target;
    setNewLead(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setNewLead(getInitialState());
  };

  const handleAddNewLead = () => {
    if (!newLead.nome || !newLead.whatsapp) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha pelo menos Nome e WhatsApp.",
      });
      return;
    }
    onAddLead({
      ...newLead,
      valor: parseFloat(newLead.valor) || 0,
      agendamento: newLead.agendamento ? new Date(newLead.agendamento).toISOString() : null,
      custom_date_field: newLead.custom_date_field ? new Date(newLead.custom_date_field).toISOString().split('T')[0] : null,
      product_id: newLead.product_id || null,
    });
    resetForm();
  };
  
  const handleObsChange = (e) => {
    setNewLead(prev => ({ ...prev, observacoes: e.target.value }));
  };

  return (
    <>
      <tr className="bg-slate-50 border-b-2 border-slate-200 hover:bg-slate-100">
        <td className="px-4 py-3 align-top"></td>
        <td className="px-4 py-3 align-top">
          <input type="text" name="nome" placeholder="* Nome do lead" value={newLead.nome} onChange={handleNewLeadChange} className="input-field-table w-full text-sm mb-2" />
          <div className="flex items-center gap-2">
            <div className="flex-1">
                <label className="text-xs text-gray-500">Entrada</label>
                <input type="date" name="data_entrada" value={newLead.data_entrada} onChange={handleNewLeadChange} className="input-field-table w-full text-sm" />
            </div>
            {customDateSettings.is_active && (
                <div className="flex-1">
                    <label className="text-xs text-gray-500">{customDateSettings.label}</label>
                    <input type="date" name="custom_date_field" value={newLead.custom_date_field} onChange={handleNewLeadChange} className="input-field-table w-full text-sm" />
                </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 align-top hidden xl:table-cell">
           <input type="text" name="whatsapp" placeholder="* WhatsApp" value={newLead.whatsapp} onChange={handleNewLeadChange} className="input-field-table w-full text-sm mb-2" />
           <input type="email" name="email" placeholder="Email" value={newLead.email} onChange={handleNewLeadChange} className="input-field-table w-full text-sm" />
        </td>
        <td className="px-4 py-3 align-top hidden lg:table-cell">
          <select name="origem" value={newLead.origem} onChange={handleNewLeadChange} className="input-field-table w-full text-sm capitalize mb-2">
            <option value="">Origem...</option>
            {settings.origins?.map(origin => <option key={origin} value={origin}>{origin}</option>)}
          </select>
          <select name="sub_origem" value={newLead.sub_origem} onChange={handleNewLeadChange} className="input-field-table w-full text-sm capitalize" disabled={!newLead.origem || !settings.sub_origins?.[newLead.origem] || settings.sub_origins?.[newLead.origem].length === 0}>
            <option value="">Sub Origem...</option>
            {newLead.origem && settings.sub_origins?.[newLead.origem]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        </td>
        <td className="px-4 py-3 align-top hidden xl:table-cell">
           <input type={settings.enable_scheduling_time ? "datetime-local" : "date"} name="agendamento" value={newLead.agendamento} onChange={handleNewLeadChange} className="input-field-table w-full text-sm" />
        </td>
        <td className="px-4 py-3 align-top">
          <select name="status" value={newLead.status} onChange={handleNewLeadChange} className="input-field-table w-full text-sm capitalize">
            {settings.statuses?.map(status => (
              <option key={status.name} value={status.name}>
                {status.name.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 align-top hidden md:table-cell">
          <select name="vendedor" value={newLead.vendedor} onChange={handleNewLeadChange} className="input-field-table w-full text-sm capitalize">
            <option value="">Vendedor...</option>
            {settings.sellers?.map(seller => <option key={seller} value={seller}>{seller}</option>)}
          </select>
        </td>
        <td className="px-4 py-3 align-top hidden lg:table-cell">
          <select name="product_id" value={newLead.product_id} onChange={handleNewLeadChange} className="input-field-table w-full text-sm capitalize">
            <option value="">Produto...</option>
            {products?.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </td>
        <td className="px-4 py-3 align-top hidden lg:table-cell">
          <input type="number" name="valor" placeholder="R$ 0,00" value={newLead.valor} onChange={handleNewLeadChange} className="input-field-table w-full text-sm" />
        </td>
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col space-y-2">
            <Button onClick={handleAddNewLead} size="sm" className="bg-green-600 hover:bg-green-700 w-full text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={() => setShowObsModal(true)} size="sm" variant="outline" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Obs.
            </Button>
          </div>
        </td>
      </tr>

      <Dialog open={showObsModal} onOpenChange={setShowObsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Observação</DialogTitle>
            <DialogDescription>
              Adicione uma observação inicial para este novo lead. Ela será salva junto com o lead.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Digite sua observação aqui..."
            value={newLead.observacoes}
            onChange={handleObsChange}
            className="min-h-[120px] mt-4"
          />
          <DialogFooter>
            <Button onClick={() => setShowObsModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewLeadRow;