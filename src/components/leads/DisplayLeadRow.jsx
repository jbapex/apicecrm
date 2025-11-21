import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Phone, Mail, Share2, TrendingUp, MessageSquare, User, Eye, CalendarHeart } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusEditor from './StatusEditor';
import SellerEditor from './SellerEditor';
import ValueEditor from './ValueEditor';
import DateEditor from './DateEditor';
import ScheduleEditor from './ScheduleEditor';
import ProductEditor from './ProductEditor';
import CustomDateField from './CustomDateField';

const DisplayLeadRow = ({
  lead,
  selectedLeads,
  onSelectOne,
  onEdit,
  onDelete,
  onShowComments,
  onShowLeadDetail,
  getStatusIcon,
  getStatusText,
  onUpdateLead,
}) => {
  const { settings } = useSettings();
  const customDateSettings = settings?.custom_fields_settings?.date_field || { is_active: false, label: '' };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (settings.enable_scheduling_time) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };
  
  const handleRowClick = (e) => {
    // Evita abrir detalhes se o clique for em um elemento interativo
    if (e.target.closest('button, [role="checkbox"], [role="combobox"], input, [role="dialog"], [data-radix-popper-content-wrapper], .date-editor-trigger, .schedule-editor-trigger')) {
      return;
    }
    onShowLeadDetail(lead);
  };

  return (
    <>
      <td className="px-4 py-3">
        <Checkbox
          checked={selectedLeads.includes(lead.id)}
          onCheckedChange={(checked) => onSelectOne(lead.id, checked)}
          aria-label={`Selecionar ${lead.nome}`}
        />
      </td>
      <td className="px-4 py-3 cursor-pointer" onClick={handleRowClick}>
        <div className="flex items-center">
            <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src={lead.profile_pic_url} alt={`Foto de ${lead.nome}`} />
                <AvatarFallback>{lead.nome ? lead.nome.charAt(0).toUpperCase() : <User />}</AvatarFallback>
            </Avatar>
            <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-[250px]">{lead.nome}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    <DateEditor lead={lead} onUpdateLead={onUpdateLead} field="data_entrada">
                        <span className="cursor-pointer hover:text-blue-600">
                            <span className="font-semibold">Entrada:</span>
                            <span className="ml-1">{new Date(lead.data_entrada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                        </span>
                    </DateEditor>
                </div>
                 {customDateSettings.is_active && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        <CustomDateField lead={lead} onUpdateLead={onUpdateLead} field="custom_date_field">
                            <span className="cursor-pointer hover:text-blue-600">
                                <span className="font-semibold">{customDateSettings.label}:</span>
                                <span className="ml-1">{lead.custom_date_field ? new Date(lead.custom_date_field).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</span>
                            </span>
                        </CustomDateField>
                    </div>
                )}
            </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap cursor-pointer hidden xl:table-cell" onClick={handleRowClick}>
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{lead.whatsapp}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate max-w-[150px]">{lead.email}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap cursor-pointer hidden lg:table-cell" onClick={handleRowClick}>
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 capitalize">
            <Share2 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{lead.origem || '-'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 capitalize">
            <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{lead.sub_origem || '-'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell schedule-editor-trigger">
        <ScheduleEditor lead={lead} onUpdateLead={onUpdateLead}>
          <span className="cursor-pointer">{formatDateTime(lead.agendamento)}</span>
        </ScheduleEditor>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusEditor 
          lead={lead}
          onUpdateLead={onUpdateLead}
          getStatusIcon={getStatusIcon}
          getStatusText={getStatusText}
        />
      </td>
      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
        <SellerEditor
          lead={lead}
          onUpdateLead={onUpdateLead}
        />
      </td>
      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
        <ProductEditor
          lead={lead}
          onUpdateLead={onUpdateLead}
        />
      </td>
      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
        <ValueEditor
          lead={lead}
          onUpdateLead={onUpdateLead}
        />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center justify-center space-x-1">
          <button onClick={() => onShowLeadDetail(lead)} className="text-gray-600 hover:text-indigo-800 dark:text-gray-400 dark:hover:text-indigo-400 p-1" title="Ver Detalhes"><Eye className="w-5 h-5" /></button>
          <button onClick={() => onShowComments(lead.id)} className="text-gray-600 hover:text-green-800 dark:text-gray-400 dark:hover:text-green-400 p-1" title="Ver Observações"><MessageSquare className="w-5 h-5" /></button>
          <button onClick={() => onEdit(lead)} className="text-gray-600 hover:text-blue-800 dark:text-gray-400 dark:hover:text-blue-400 p-1" title="Editar"><Edit className="w-5 h-5" /></button>
          <button onClick={() => onDelete(lead.id)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1" title="Excluir"><Trash2 className="w-5 h-5" /></button>
        </div>
      </td>
    </>
  );
};

export default DisplayLeadRow;