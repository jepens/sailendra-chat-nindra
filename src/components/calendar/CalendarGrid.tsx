import { CalendarEvent } from "@/types/calendar";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
}

export const CalendarGrid = ({ currentDate, events, onDateClick }: CalendarGridProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = event.start.dateTime ? 
        new Date(event.start.dateTime) : 
        new Date(event.start.date || '');
      return isSameDay(eventDate, date);
    });
  };

  const getDayClasses = (date: Date) => {
    const classes = ['p-2', 'min-h-[100px]', 'border', 'cursor-pointer', 'hover:bg-muted/50', 'transition-colors'];
    
    if (!isSameMonth(date, currentDate)) {
      classes.push('text-muted-foreground', 'bg-muted/20');
    }
    
    if (isToday(date)) {
      classes.push('bg-primary/10', 'border-primary');
    }
    
    return classes.join(' ');
  };

  return (
    <div className="calendar-grid">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center font-semibold bg-muted/50 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          
          return (
            <div
              key={index}
              className={getDayClasses(date)}
              onClick={() => onDateClick?.(date)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium ${isToday(date) ? 'text-primary' : ''}`}>
                  {format(date, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={`${event.id}-${eventIndex}`}
                    className="text-xs p-1 bg-primary/20 rounded truncate"
                    title={event.summary}
                  >
                    {event.summary}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 