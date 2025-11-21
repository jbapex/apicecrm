import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Import, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { DateTimePicker } from '@/components/ui/date-time-picker';

const StagedLeadRow = ({
  lead,
  isSelected,
  onSelect,
  onUpdate,
  onImport,
  onDelete,
  settings,
}) => {
  const handleFieldChange = (field, value) => {
    onUpdate(lead.id, field, value);
  };

  const canImport = lead.lead_status && lead.origem;
  const subOrigins = settings?.sub_origins?.[lead.origem] || [];

  return (
    <tr className="border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50">
      <td className="p-4 align-middle">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(lead.id, checked)}
          aria-label="Selecionar lead"
        />
      </td>
      <td className="p-4 align-middle font-medium">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={lead.profile_pic_url} alt={lead.nome} />
            <AvatarFallback>{lead.nome ? lead.nome.charAt(0).toUpperCase() : <User />}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold">{lead.nome}</div>
            <div className="text-sm text-gray-500">{lead.whatsapp}</div>
          </div>
        </div>
      </td>
      <td className="p-4 align-middle text-sm text-gray-500">
        {format(new Date(lead.data_recebimento), 'dd/MM/yyyy HH:mm')}
      </td>
      <td className="p-4 align-middle">
        <Select
          value={lead.lead_status || ''}
          onValueChange={(value) => handleFieldChange('lead_status', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {settings?.statuses?.map((status) => (
              <SelectItem key={status.name} value={status.name}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-4 align-middle">
        <Select
          value={lead.origem || ''}
          onValueChange={(value) => {
            handleFieldChange('origem', value);
            handleFieldChange('sub_origem', null); // Clear sub_origem when origin changes
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            {settings?.origins?.map((origin) => (
              <SelectItem key={origin} value={origin}>
                {origin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-4 align-middle">
        <Select
          value={lead.sub_origem || ''}
          onValueChange={(value) => handleFieldChange('sub_origem', value)}
          disabled={!lead.origem || subOrigins.length === 0}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sub Origem" />
          </SelectTrigger>
          <SelectContent>
            {subOrigins.map((subOrigin) => (
              <SelectItem key={subOrigin} value={subOrigin}>
                {subOrigin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-4 align-middle">
        <DateTimePicker
          date={lead.agendamento ? new Date(lead.agendamento) : null}
          setDate={(date) => handleFieldChange('agendamento', date ? date.toISOString() : null)}
        />
      </td>
      <td className="p-4 align-middle">
        <Input
          type="text"
          placeholder="Observações"
          value={lead.observacoes || ''}
          onChange={(e) => handleFieldChange('observacoes', e.target.value)}
          className="w-[200px]"
        />
      </td>
      <td className="p-4 align-middle text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImport(lead.id)}
            disabled={!canImport}
            title={canImport ? "Importar Lead" : "Preencha Status e Origem para importar"}
          >
            <Import className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(lead.id)}
            className="text-red-500 hover:text-red-700"
            title="Excluir Lead"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default StagedLeadRow;