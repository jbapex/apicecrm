import React from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Phone, Calendar, Tag, User, Eye, Package } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusEditor from './StatusEditor';
import ValueEditor from './ValueEditor';
import ScheduleEditor from './ScheduleEditor';

const LeadCard = ({
  lead,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onShowDetail,
  getStatusIcon,
  getStatusText,
  onUpdateLead,
}) => {
  const { settings } = useSettings();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const CardDetail = ({ icon: Icon, value, className = '' }) => (
    <div className={`flex items-center text-xs text-gray-600 dark:text-gray-300 ${className}`}>
      <Icon className="w-3 h-3 mr-1.5 flex-shrink-0" />
      <span className="truncate">{value || '-'}</span>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 ${selected ? 'border-blue-500' : 'border-transparent'}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start flex-grow" onClick={() => onShowDetail(lead)}>
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Selecionar ${lead.nome}`}
              className="mt-1 mr-4"
            />
            <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={lead.profile_pic_url} alt={`Foto de ${lead.nome}`} />
                <AvatarFallback>{lead.nome ? lead.nome.charAt(0).toUpperCase() : <User />}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-bold text-base text-gray-900 dark:text-gray-100">{lead.nome}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Entrada: {formatDate(lead.data_entrada)}</p>
            </div>
          </div>
          <div className="w-36" onClick={(e) => e.stopPropagation()}>
            <StatusEditor
              lead={lead}
              onUpdateLead={onUpdateLead}
              getStatusIcon={getStatusIcon}
              getStatusText={getStatusText}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 pl-16">
          <CardDetail icon={Phone} value={lead.whatsapp} />
          <ScheduleEditor lead={lead} onUpdateLead={onUpdateLead}>
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
              <Calendar className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">{lead.agendamento ? `Ag: ${formatDate(lead.agendamento)}` : 'Sem agendamento'}</span>
            </div>
          </ScheduleEditor>
          <CardDetail icon={Tag} value={lead.vendedor} />
          <div onClick={(e) => e.stopPropagation()}>
            <ValueEditor lead={lead} onUpdateLead={onUpdateLead} />
          </div>
          <CardDetail icon={Package} value={lead.product?.name || 'Sem produto'} className="col-span-2" />
        </div>

        <div className="flex items-center justify-end space-x-2 border-t border-gray-100 dark:border-gray-700 pt-3">
          <button onClick={() => onShowDetail(lead)} className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium p-1">
            <Eye className="w-4 h-4 mr-1" /> Ver
          </button>
          <button onClick={() => onEdit(lead)} className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium p-1">
            <Edit className="w-4 h-4 mr-1" /> Editar
          </button>
          <button onClick={() => onDelete(lead.id)} className="flex items-center text-xs text-red-600 hover:text-red-800 font-medium p-1">
            <Trash2 className="w-4 h-4 mr-1" /> Excluir
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LeadCard;