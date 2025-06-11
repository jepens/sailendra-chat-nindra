import { CalendarEvent } from "@/types/calendar";
import EventCard from './EventCard';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';

interface AgendaViewProps {
  events: CalendarEvent[];
}

export const AgendaView = ({ events }: AgendaViewProps) => {
  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = event.start?.dateTime || event.start?.date || '';
      if (dateKey) {
        const date = new Date(dateKey);
        const dateString = date.toDateString();
        if (!grouped[dateString]) {
          grouped[dateString] = [];
        }
        grouped[dateString].push(event);
      }
    });

    // Sort events within each date by start time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const aTime = a.start?.dateTime || a.start?.date || '';
        const bTime = b.start?.dateTime || b.start?.date || '';
        return new Date(aTime).getTime() - new Date(bTime).getTime();
      });
    });

    return grouped;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return `Today - ${format(date, 'EEEE, MMMM dd, yyyy')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow - ${format(date, 'EEEE, MMMM dd, yyyy')}`;
    } else if (isYesterday(date)) {
      return `Yesterday - ${format(date, 'EEEE, MMMM dd, yyyy')}`;
    } else {
      return format(date, 'EEEE, MMMM dd, yyyy');
    }
  };

  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-lg font-medium mb-2">No events</p>
          <p className="text-sm">No events found for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {sortedDates.map(dateKey => (
        <div key={dateKey} className="space-y-4">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3">
            <h3 className="text-lg font-semibold text-foreground">
              {formatDateHeader(dateKey)}
            </h3>
            <div className="text-sm text-muted-foreground">
              {groupedEvents[dateKey].length} event{groupedEvents[dateKey].length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="space-y-3">
            {groupedEvents[dateKey].map((event, index) => (
              <EventCard
                key={`${event.id}-${index}`}
                event={event}
                compact={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 