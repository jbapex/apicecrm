import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Import, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { DateTimePicker } from '@/components/ui/date-time-picker';

const StagedLeadCard = ({
  lead,
  isSelected,
  onSelect,
  onUpdate,
  onImport,
  onDelete,
  settings,
}) => {
  const handleFieldChange = (field, value) => {
    onUpdate(lead.id, { [field]: value });
  };

  const canImport = lead.lead_status && lead.origem;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg p-4 card-shadow space-y-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(lead.id, checked)}
            className="mt-1"
          />
          <Avatar className="h-12 w-12">
            <AvatarImage src={lead.profile_pic_url} alt={lead.nome} />
            <AvatarFallback>{lead.nome ? lead.nome.charAt(0).toUpperCase() : <User />}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg">{lead.nome}</h3>
            <p className="text-sm text-gray-500">{lead.whatsapp}</p>
          </div>
        </div>
        <div className="text-xs text-gray-500 text-right">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(lead.data_recebimento), 'dd/MM/yy')}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(lead.data_recebimento), 'HH:mm')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select
            value={lead.lead_status || ''}
            onValueChange={(value) => handleFieldChange('lead_status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o Status" />
            </SelectTrigger>
            <SelectContent>
              {settings.statuses?.map((status) => (
                <SelectItem key={status.name} value={status.name}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Origem</label>
          <Select
            value={lead.origem || ''}
            onValueChange={(value) => handleFieldChange('origem', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a Origem" />
            </SelectTrigger>
            <SelectContent>
              {settings.origins?.map((origin) => (
                <SelectItem key={origin} value={origin}>
                  {origin}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Agendamento</label>
        <DateTimePicker
          date={lead.agendamento ? new Date(lead.agendamento) : null}
          setDate={(date) => handleFieldChange('agendamento', date ? date.toISOString() : null)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Observações</label>
        <Input
          type="text"
          placeholder="Adicionar observação..."
          value={lead.observacoes || ''}
          onChange={(e) => handleFieldChange('observacoes', e.target.value)}
        />
      </div>

      <div className="flex justify-end items-center gap-2 pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(lead.id)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
        <Button
          size="sm"
          onClick={() => onImport(lead.id)}
          disabled={!canImport}
          title={canImport ? "Importar Lead" : "Preencha Status e Origem para importar"}
        >
          <Import className="h-4 w-4 mr-2" />
          Importar
        </Button>
      </div>
    </motion.div>
  );
};

export default StagedLeadCard;