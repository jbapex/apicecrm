import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, isSameDay, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LeadDetailModal from '@/components/modals/LeadDetailModal';
import { useToast } from '@/components/ui/use-toast';
import AgendaEvent from '@/components/calendar/AgendaEvent';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import CustomDateCell from '@/components/calendar/CustomDateCell';
import DayEventsModal from '@/components/modals/DayEventsModal';
import { useAppointments } from '@/hooks/useAppointments';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

const AgendamentosContent = ({ statuses, getStatusText, onUpdateLead, getStatusIcon }) => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dayModalData, setDayModalData] = useState({ isOpen: false, date: null, events: [] });
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { events, loading, fetchAppointments } = useAppointments();

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSelectEvent = useCallback((event) => {
    setSelectedLead(event.resource);
    setIsModalOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedLead(null);
  }, []);

  const handleDayClick = useCallback((date) => {
    const eventsForDay = events.filter(event => isSameDay(event.start, date));
    if (eventsForDay.length > 0) {
      setDayModalData({ isOpen: true, date, events: eventsForDay });
    }
  }, [events]);

  const closeDayModal = useCallback(() => {
    setDayModalData({ isOpen: false, date: null, events: [] });
  }, []);

  const handleEventDrop = useCallback(
    async ({ event, start }) => {
      const originalEvent = events.find(e => e.resource.id === event.resource.id);
      if (!originalEvent) return;

      const leadId = originalEvent.resource.id;
      const newAgendamento = start.toISOString();
      
      const result = await onUpdateLead(leadId, { agendamento: newAgendamento });
      if (result.success) {
        toast({
          title: "Agendamento Atualizado!",
          description: `O agendamento de ${originalEvent.resource.nome} foi movido para ${format(start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`
        });
        fetchAppointments(); // Re-fetch to ensure calendar is up-to-date
      }
    },
    [onUpdateLead, toast, events, fetchAppointments]
  );

  const eventStyleGetter = useCallback((event) => {
    if (!event || !event.resource) return {};
    const statusObj = statuses.find(s => s.name === event.resource.status);
    const backgroundColor = statusObj ? statusObj.color : '#3b82f6';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        cursor: 'pointer'
      },
    };
  }, [statuses]);

  const components = useMemo(() => {
    const monthComponentConfig = isMobile 
      ? {
          dateCellWrapper: (props) => (
            <CustomDateCell {...props} events={events} statuses={statuses} onDayClick={handleDayClick} isMobile={isMobile} />
          ),
          event: () => null, 
        }
      : {};

    return {
      agenda: {
        event: (props) => <AgendaEvent {...props} statuses={statuses} getStatusText={getStatusText} onSelectEvent={handleSelectEvent} />,
      },
      month: monthComponentConfig,
      event: (props) => {
        if (!props.event || !props.event.resource) return null;
        return (
          <div className="text-xs truncate">
            <strong>{props.title}</strong>
          </div>
        );
      }
    };
  }, [events, statuses, getStatusText, isMobile, handleDayClick, handleSelectEvent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        key="agendamentos"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col flex-grow h-[85vh] bg-white rounded-lg card-shadow p-4"
      >
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ flexGrow: 1 }}
          culture="pt-BR"
          defaultView={isMobile ? 'month' : 'month'}
          views={isMobile ? ['month', 'agenda'] : ['month', 'week', 'day', 'agenda']}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período.",
            showMore: total => `+ Ver mais (${total})`
          }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          onEventDrop={handleEventDrop}
          resizable={false}
          selectable={true}
          onSelectSlot={isMobile ? (slotInfo) => handleDayClick(slotInfo.start) : undefined}
          components={components}
        />
      </motion.div>
      <AnimatePresence>
        {isModalOpen && selectedLead && (
            <LeadDetailModal
                lead={selectedLead}
                isOpen={isModalOpen}
                onClose={closeModal}
                statuses={statuses}
                getStatusText={getStatusText}
                onUpdateLead={onUpdateLead}
                getStatusIcon={getStatusIcon}
            />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {dayModalData.isOpen && (
          <DayEventsModal
            isOpen={dayModalData.isOpen}
            onClose={closeDayModal}
            date={dayModalData.date}
            events={dayModalData.events}
            statuses={statuses}
            getStatusText={getStatusText}
            onSelectEvent={handleSelectEvent}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AgendamentosContent;