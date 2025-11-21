import React, { useMemo, useState, useEffect } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { createPortal } from 'react-dom';

const KANBAN_ORDER_KEY = 'kanbanColumnOrder';

const KanbanBoard = ({ leads, onUpdateLead, onShowLeadDetail }) => {
  const { settings, getStatusText } = useSettings();
  const { user } = useAuth();
  
  const [activeItem, setActiveItem] = useState(null);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const initialColumns = settings.statuses?.map(status => ({ id: status.name, title: status.name, color: status.color })) || [];
    
    if (user) {
      const savedOrderJSON = localStorage.getItem(`${KANBAN_ORDER_KEY}_${user.id}`);
      if (savedOrderJSON) {
        try {
          const savedOrder = JSON.parse(savedOrderJSON);
          const orderedColumns = savedOrder
            .map(id => initialColumns.find(c => c.id === id))
            .filter(Boolean);
          
          const newColumns = initialColumns.filter(c => !savedOrder.includes(c.id));
          setColumns([...orderedColumns, ...newColumns]);
        } catch (e) {
          setColumns(initialColumns);
        }
      } else {
        setColumns(initialColumns);
      }
    } else {
      setColumns(initialColumns);
    }
  }, [settings.statuses, user]);

  const leadsByStatus = useMemo(() => {
    const grouped = {};
    columns.forEach(col => {
      grouped[col.id] = [];
    });
    leads.forEach(lead => {
      const statusKey = lead.status || 'sem_status';
      if (grouped.hasOwnProperty(statusKey)) {
        grouped[statusKey].push(lead);
      }
    });
    return grouped;
  }, [leads, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'Column') {
      setActiveItem({ type: 'Column', data: columns.find(c => c.id === active.id) });
    } else if (type === 'Lead') {
      setActiveItem({ type: 'Lead', data: leads.find(l => l.id === active.id) });
    }
  };

  const handleDragEnd = (event) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;
  
    const activeType = active.data.current?.type;
  
    if (activeType === 'Column' && active.id !== over.id) {
        const oldIndex = columns.findIndex(c => c.id === active.id);
        const newIndex = columns.findIndex(c => c.id === over.id);
        const newOrder = arrayMove(columns, oldIndex, newIndex);
        setColumns(newOrder);
        if (user) {
            localStorage.setItem(`${KANBAN_ORDER_KEY}_${user.id}`, JSON.stringify(newOrder.map(c => c.id)));
        }
        return;
    }
  
    if (activeType === 'Lead') {
        const activeContainer = active.data.current?.sortable?.containerId;
        const overContainer = over.data.current?.sortable?.containerId ?? over.id;

        if (activeContainer && overContainer && activeContainer !== overContainer) {
            const isValidStatus = columns.some(col => col.id === overContainer);

            if (isValidStatus) {
                const leadId = active.id;
                const newStatus = overContainer;
                onUpdateLead(leadId, { status: newStatus });
            }
        }
    }
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };
  
  const activeLead = activeItem?.type === 'Lead' ? activeItem.data : null;
  const activeColumn = activeItem?.type === 'Column' ? activeItem.data : null;

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 min-h-screen">
      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd} 
        onDragCancel={handleDragCancel}
        collisionDetection={closestCorners}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                leads={leadsByStatus[column.id] || []}
                onShowLeadDetail={onShowLeadDetail}
                getStatusText={getStatusText}
                isDragging={activeColumn?.id === column.id}
              />
            ))}
          </SortableContext>
        </div>
        {createPortal(
          <DragOverlay dropAnimation={null}>
              {activeLead && <KanbanCard lead={activeLead} isOverlay onShowLeadDetail={() => {}} />}
              {activeColumn && <KanbanColumn id={activeColumn.id} title={activeColumn.title} color={activeColumn.color} leads={leadsByStatus[activeColumn.id] || []} isOverlay getStatusText={getStatusText} />}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

export default KanbanBoard;