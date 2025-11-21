import React from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

const KanbanColumn = ({ id, title, color, leads, onShowLeadDetail, getStatusText, isOverlay, isDragging }) => {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ 
    id: id,
    data: {
        type: 'Column',
        title: title
    }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTitleColor = (hex) => {
    if (!hex) return '#000000';
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#ffffff';
    } catch (e) {
      return '#000000';
    }
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col w-72 md:w-80 flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md",
        isOverlay && "ring-2 ring-blue-500"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        style={{ backgroundColor: color, color: getTitleColor(color) }}
        className="p-3 font-semibold text-lg rounded-t-lg flex justify-between items-center cursor-grab touch-none"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 opacity-60" />
          <span className="capitalize">{getStatusText(title)}</span>
        </div>
        <span className="text-sm font-normal bg-black/20 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>
      <div className="p-2 flex-grow overflow-y-auto min-h-[200px] max-h-[calc(100vh-250px)] scrollbar-thin">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {leads.map(lead => (
              <KanbanCard key={lead.id} lead={lead} onShowLeadDetail={onShowLeadDetail} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;