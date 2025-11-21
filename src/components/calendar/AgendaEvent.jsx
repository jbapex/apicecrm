import React from 'react';
import { format } from 'date-fns';

const AgendaEvent = ({ event, statuses, getStatusText, onSelectEvent }) => {
  const statusInfo = statuses.find(s => s.name === event.resource.status) || {};
  const statusColor = statusInfo.color || '#cccccc';

  return (
    <div 
      className="flex items-center w-full p-3 my-2 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-l-4"
      style={{ borderLeftColor: statusColor }}
      onClick={() => onSelectEvent(event)}
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
    </div>
  );
};

export default AgendaEvent;