import React from 'react';
import { isSameDay } from 'date-fns';

const CustomDateCell = ({ children, value, events, statuses, onDayClick, isMobile }) => {
  if (!isMobile) {
    return children;
  }

  const eventsForDay = events.filter(event => isSameDay(new Date(event.start), value));
  
  const hasEvents = eventsForDay.length > 0;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasEvents) {
      onDayClick(value);
    }
  };
  
  return (
    <div
      onClick={handleClick}
      className={`relative h-full w-full ${hasEvents ? 'cursor-pointer' : ''} rbc-day-bg`}
    >
      {children}
      {hasEvents && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
          {eventsForDay.slice(0, 3).map((event, index) => {
            const statusObj = statuses.find(s => s.name === event.resource.status);
            const color = statusObj ? statusObj.color : '#3b82f6';
            return (
              <div
                key={`${event.resource.id}-${index}`}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomDateCell;