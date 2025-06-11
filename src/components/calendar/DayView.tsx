import { CalendarEvent } from '@/types/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, isToday } from 'date-fns';
import EventCard from './EventCard';

interface DayViewProps {
  events: CalendarEvent[];
  currentDate: Date;
}

export const DayView = ({ events, currentDate }: DayViewProps) => {
  // Get events for the current day
  const dayEvents = events.filter(event => {
    const eventDate = event.start?.dateTime ? 
      new Date(event.start.dateTime) : 
      event.start?.date ? new Date(event.start.date) : null;
    
    return eventDate && isSameDay(eventDate, currentDate);
  });

  // Sort events by start time
  const sortedEvents = dayEvents.sort((a, b) => {
    const aTime = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
    const bTime = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
    return aTime - bTime;
  });

  const formatDayTitle = () => {
    const today = isToday(currentDate);
    const dayName = format(currentDate, 'EEEE');
    const date = format(currentDate, 'MMMM d, yyyy');
    
    return today ? `Today - ${dayName}, ${date}` : `${dayName}, ${date}`;
  };

  // Group events by time slots
  const timedEvents = sortedEvents.filter(event => event.start?.dateTime);
  const allDayEvents = sortedEvents.filter(event => event.start?.date && !event.start?.dateTime);

  return (
    <div className="space-y-4">
      {/* Day header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>{formatDayTitle()}</span>
            <Badge variant="secondary">
              {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">All Day Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allDayEvents.map((event, index) => (
              <EventCard key={`${event.id}-${index}`} event={event} compact={false} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Timed events */}
      {timedEvents.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Scheduled Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {timedEvents.map((event, index) => {
              const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : null;
              const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
              
              return (
                <div key={`${event.id}-${index}`} className="flex items-start space-x-4">
                  {/* Time column */}
                  <div className="w-20 flex-shrink-0 text-right">
                    <div className="text-sm font-medium text-foreground">
                      {startTime ? format(startTime, 'HH:mm') : 'All day'}
                    </div>
                    {endTime && startTime && (
                      <div className="text-xs text-muted-foreground">
                        {format(endTime, 'HH:mm')}
                      </div>
                    )}
                  </div>
                  
                  {/* Event card */}
                  <div className="flex-1">
                    <EventCard event={event} compact={false} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        !allDayEvents.length && (
          <Card>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-lg font-medium mb-2">No events scheduled</p>
                <p className="text-sm">You have no events for this day.</p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Timeline view for visualization */}
      {timedEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Time slots */}
              <div className="space-y-4">
                {Array.from({ length: 24 }, (_, hour) => {
                  const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                  const eventsInSlot = timedEvents.filter(event => {
                    if (!event.start?.dateTime) return false;
                    const eventHour = new Date(event.start.dateTime).getHours();
                    return eventHour === hour;
                  });

                  return (
                    <div key={hour} className="flex items-start space-x-4">
                      <div className="w-16 text-xs text-muted-foreground text-right pt-1">
                        {timeSlot}
                      </div>
                      <div className="flex-1 border-l border-border pl-4 min-h-[40px]">
                        {eventsInSlot.length > 0 ? (
                          <div className="space-y-2">
                            {eventsInSlot.map((event, index) => (
                              <div
                                key={`${event.id}-timeline-${index}`}
                                className="bg-primary/10 border border-primary/20 rounded p-2 text-sm"
                              >
                                <div className="font-medium text-primary">{event.summary}</div>
                                {event.location && (
                                  <div className="text-xs text-muted-foreground">📍 {event.location}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-2"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 