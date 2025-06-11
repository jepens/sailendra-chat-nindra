import { CalendarEvent } from '@/types/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateClick?: (date: Date) => void;
}

export const WeekView = ({ events, currentDate, onDateClick }: WeekViewProps) => {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
      const startTime = format(new Date(event.start.dateTime), 'HH:mm');
      const endTime = event.end?.dateTime ? format(new Date(event.end.dateTime), 'HH:mm') : '';
      return endTime ? `${startTime} - ${endTime}` : startTime;
    }
    return 'All day';
  };

  const getEventDuration = (event: CalendarEvent) => {
    if (event.start?.dateTime && event.end?.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Math.max(1, durationHours); // Minimum 1 hour for display
    }
    return 1;
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isDayToday = isToday(day);
            
            return (
              <div key={day.toISOString()} className="text-center">
                <div className={`
                  text-sm font-medium p-2 rounded
                  ${isDayToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}
                `}>
                  <div className="text-xs opacity-75">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-lg font-bold">
                    {format(day, 'd')}
                  </div>
                </div>
                
                {dayEvents.length > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Week events grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isDayToday = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[300px] p-2 border rounded cursor-pointer transition-colors
                  ${isDayToday ? 'bg-primary/5 border-primary/20' : 'bg-background border-border'}
                  hover:bg-muted/50
                `}
                onClick={() => onDateClick?.(day)}
              >
                <div className="space-y-1">
                  {dayEvents.map((event, index) => {
                    const duration = getEventDuration(event);
                    
                    return (
                      <div
                        key={`${event.id}-${index}`}
                        className={`
                          p-2 rounded text-xs
                          ${event.status === 'confirmed' ? 'bg-primary/10 border-l-2 border-l-primary' :
                            event.status === 'tentative' ? 'bg-yellow-50 border-l-2 border-l-yellow-400' :
                            'bg-muted border-l-2 border-l-muted-foreground'}
                        `}
                        style={{
                          minHeight: `${Math.min(duration * 20, 80)}px` // Scale based on duration
                        }}
                        title={`${event.summary} - ${formatEventTime(event)}`}
                      >
                        <div className="font-medium text-primary mb-1 line-clamp-2">
                          {event.summary}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatEventTime(event)}
                        </div>
                        
                        {event.location && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            📍 {event.location}
                          </div>
                        )}
                        
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            👥 {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {dayEvents.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}; 