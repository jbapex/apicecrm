import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const QuickAddContent = ({ onAddLead }) => {
  const { toast } = useToast();
  const initialFormState = {
    nome: '',
    whatsapp: '',
    email: '',
    origem: '',
    agendamento: '',
    status: 'agendado',
    vendedor: '',
    valor: '',
    observacoes: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const nomeInputRef = useRef(null);

  useEffect(() => {
    nomeInputRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.whatsapp) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha os campos Nome e WhatsApp.",
      });
      return;
    }
    setLoading(true);
    await onAddLead({ ...formData, valor: parseFloat(formData.valor) || 0 });
    setLoading(false);
    toast({
      title: "Lead adicionado com sucesso!",
      description: `${formData.nome} foi cadastrado.`
    })
    setFormData(initialFormState);
    nomeInputRef.current?.focus();
  };

  return (
    <motion.div
      key="quick-add"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg p-6 sm:p-8 card-shadow max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Lançamento Rápido de Lead</h2>
        <p className="text-gray-500 mb-6">Preencha os campos abaixo e clique em "Adicionar" para cadastrar um novo lead rapidamente.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                ref={nomeInputRef}
                type="text"
                name="nome"
                required
                value={formData.nome}
                onChange={handleChange}
                className="input-field"
                placeholder="Nome completo do lead"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
              <input
                type="tel"
                name="whatsapp"
                required
                value={formData.whatsapp}
                onChange={handleChange}
                className="input-field"
                placeholder="(11) 98765-4321"
              />
            </div>
            
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <select
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Selecione...</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Google">Google</option>
                <option value="Indicação">Indicação</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Site">Site</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Agendamento</label>
              <input
                type="date"
                name="agendamento"
                value={formData.agendamento}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
              <select
                name="vendedor"
                value={formData.vendedor}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Selecione...</option>
                <option value="Ana Costa">Ana Costa</option>
                <option value="Carla Lima">Carla Lima</option>
              </select>
            </div>

             <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder="Detalhes adicionais sobre o lead..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="btn-primary flex items-center w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <PlusCircle className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Adicionando...' : 'Adicionar Lead'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default QuickAddContent;