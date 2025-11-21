import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Calendar, Tag } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const KanbanCard = ({ lead, onShowLeadDetail, isOverlay }) => {
  const { settings } = useSettings();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (!date || isNaN(date.getTime())) return '-';
    
    if (settings.enable_scheduling_time) {
        return format(date, 'dd/MM/yy HH:mm');
    }
    return format(date, 'dd/MM/yy');
  };

  const handleCardClick = (e) => {
    if(isDragging || isOverlay) return;
    e.stopPropagation();
    onShowLeadDetail(lead);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "bg-white dark:bg-gray-700 rounded-md p-3 shadow-sm touch-manipulation",
        isOverlay && "opacity-100 shadow-2xl z-50 cursor-grabbing",
        isDragging && "cursor-grabbing"
      )}
    >
      <div {...listeners} className={cn("cursor-grab", (isDragging || isOverlay) && "cursor-grabbing")}>
        <div className="flex items-start justify-between mb-2" onClick={handleCardClick} style={{cursor: 'pointer'}}>
          <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={lead.profile_pic_url} alt={lead.nome} />
                  <AvatarFallback>{lead.nome ? lead.nome.charAt(0).toUpperCase() : <User />}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{lead.nome}</p>
          </div>
        </div>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300" onClick={handleCardClick} style={{cursor: 'pointer'}}>
          <div className="flex items-center">
            <Phone className="w-3 h-3 mr-1.5"/> {lead.whatsapp || '-'}
          </div>
          {lead.agendamento && (
              <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1.5" /> Ag: {formatDate(lead.agendamento)}
              </div>
          )}
          {lead.vendedor && (
              <div className="flex items-center">
                  <Tag className="w-3 h-3 mr-1.5" /> {lead.vendedor}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;