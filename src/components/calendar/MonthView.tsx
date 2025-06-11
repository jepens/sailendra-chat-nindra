import { CalendarEvent } from '@/types/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';

interface MonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateClick?: (date: Date) => void;
}

export const MonthView = ({ events, currentDate, onDateClick }: MonthViewProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Generate all days for the calendar grid
  const generateCalendarDays = () => {
    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }

    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = event.start?.dateTime ? 
        new Date(event.start.dateTime) : 
        event.start?.date ? new Date(event.start.date) : null;
      
      return eventDate && isSameDay(eventDate, date);
    });
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start?.dateTime) {
      return format(new Date(event.start.dateTime), 'HH:mm');
    }
    return 'All day';
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  
  // Group days into weeks
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardContent className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[100px] p-1 border rounded cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                      ${isDayToday ? 'bg-primary/10 border-primary' : 'border-border'}
                      hover:bg-muted/50
                    `}
                    onClick={() => onDateClick?.(day)}
                  >
                    {/* Day number */}
                    <div className={`
                      text-sm font-medium mb-1
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                      ${isDayToday ? 'text-primary font-bold' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, index) => (
                        <div
                          key={`${event.id}-${index}`}
                          className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                          title={`${event.summary} - ${formatEventTime(event)}`}
                        >
                          <div className="font-medium truncate">{event.summary}</div>
                          <div className="text-xs opacity-75">{formatEventTime(event)}</div>
                        </div>
                      ))}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground p-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 