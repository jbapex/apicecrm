import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DayEventsModal = ({ isOpen, onClose, date, events, statuses, getStatusText, onSelectEvent }) => {
  if (!isOpen) return null;

  const sortedEvents = [...events].sort((a, b) => a.start - b.start);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ''}
          </DialogTitle>
          <DialogDescription>
            Agendamentos para este dia.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          <AnimatePresence>
            {sortedEvents.length > 0 ? (
              <motion.ul className="space-y-3">
                {sortedEvents.map((event, index) => {
                  const statusInfo = statuses.find(s => s.name === event.resource.status) || {};
                  const statusColor = statusInfo.color || '#cccccc';

                  return (
                    <motion.li
                      key={event.resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center w-full p-3 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-l-4"
                      style={{ borderLeftColor: statusColor }}
                      onClick={() => {
                        onSelectEvent(event);
                        onClose();
                      }}
                    >
                      <div className="w-20 text-gray-800 font-bold text-lg">
                        {format(event.start, 'HH:mm')}
                      </div>
                      <div className="flex-grow text-gray-800 font-medium text-base">
                        {event.title}
                      </div>
                      <div className="flex items-center justify-end ml-4">
                        <span 
                          className="px-3 py-1 text-xs font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${statusColor}20`,
                            color: statusColor
                          }}
                        >
                          {getStatusText(event.resource.status)}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            ) : (
              <p className="text-center text-gray-500 py-8">Não há agendamentos para este dia.</p>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayEventsModal;