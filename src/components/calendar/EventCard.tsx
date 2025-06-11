import { CalendarEvent } from "@/types/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink, 
  User,
  Mail,
  Phone,
  Video,
  FileText
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isYesterday } from "date-fns";
import { id } from "date-fns/locale";
import { calendarService } from "@/services/calendarService";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
}

const EventCard = ({ event, compact = false }: EventCardProps) => {
  // Format date and time
  const getEventDateTime = () => {
    if (event.start?.dateTime) {
      const startDate = parseISO(event.start.dateTime);
      const endDate = event.end?.dateTime ? parseISO(event.end.dateTime) : null;
      
      let dateLabel = '';
          if (isToday(startDate)) {
      dateLabel = 'Today';
    } else if (isTomorrow(startDate)) {
      dateLabel = 'Tomorrow';
    } else if (isYesterday(startDate)) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = format(startDate, 'EEEE, MMMM dd, yyyy');
    }
      
      const startTime = format(startDate, 'HH:mm');
      const endTime = endDate ? format(endDate, 'HH:mm') : null;
      
      return {
        date: dateLabel,
        time: endTime ? `${startTime} - ${endTime}` : startTime,
        isAllDay: false
      };
    } else if (event.start?.date) {
      const startDate = parseISO(event.start.date);
      return {
        date: format(startDate, 'EEEE, MMMM dd, yyyy'),
        time: 'All day',
        isAllDay: true
      };
    }
    
    return { date: 'TBD', time: 'TBD', isAllDay: false };
  };

  // Get status badge variant
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'tentative':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get attendee initials
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.split('@')[0].slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Check if location is a meeting link
  const isVideoMeeting = (location?: string) => {
    if (!location) return false;
    return location.includes('meet.google.com') || 
           location.includes('zoom.us') || 
           location.includes('teams.microsoft.com') ||
           location.includes('webex.com');
  };

  const eventDateTime = getEventDateTime();

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{event.summary}</h3>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {eventDateTime.time}
              </div>
            </div>
            <Badge variant={getStatusVariant(event.status)} className="ml-2 text-xs">
              {event.status || 'unknown'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{event.summary}</CardTitle>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1.5" />
              {eventDateTime.date}
            </div>
          </div>
                  <Badge variant={getStatusVariant(event.status)} className="ml-2">
          {event.status === 'confirmed' ? 'Confirmed' :
           event.status === 'tentative' ? 'Tentative' :
           event.status === 'cancelled' ? 'Cancelled' : 
           event.status || 'Unknown'}
        </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Time */}
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
          <div>
            <span className="font-medium">{eventDateTime.time}</span>
            {eventDateTime.isAllDay && (
              <Badge variant="outline" className="ml-2 text-xs">
                All day
              </Badge>
            )}
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start">
            {isVideoMeeting(event.location) ? (
              <Video className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0 mt-0.5" />
            ) : (
              <MapPin className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {isVideoMeeting(event.location) ? (
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm font-normal text-blue-600 hover:text-blue-800"
                  onClick={() => window.open(event.location, '_blank')}
                >
                  <span className="truncate">{event.location}</span>
                  <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                </Button>
              ) : (
                <span className="text-sm break-words">{event.location}</span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="flex items-start">
            <FileText className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="line-clamp-3">{event.description}</p>
            </div>
          </div>
        )}

        {/* Organizer */}
        {event.organizer && (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="text-sm font-medium">Organizer: </span>
              <span className="text-sm">
                {event.organizer.displayName || event.organizer.email || 'Unknown'}
              </span>
              {event.organizer.email && event.organizer.displayName && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({event.organizer.email})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <Users className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium">
                Attendees ({event.attendees.length})
              </span>
            </div>
            
            <div className="ml-7 space-y-2">
              {/* Show first 5 attendees */}
              {event.attendees.slice(0, 5).map((attendee, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(attendee.displayName, attendee.email)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm truncate">
                        {attendee.displayName || attendee.email}
                      </span>
                      
                      {/* Response status */}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          attendee.responseStatus === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                          attendee.responseStatus === 'declined' ? 'bg-red-50 text-red-700 border-red-200' :
                          attendee.responseStatus === 'tentative' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                                             >
                         {attendee.responseStatus === 'accepted' ? 'Accepted' :
                          attendee.responseStatus === 'declined' ? 'Declined' :
                          attendee.responseStatus === 'tentative' ? 'Tentative' :
                          'No response'}
                       </Badge>
                    </div>
                    
                    {attendee.displayName && attendee.email && (
                      <div className="text-xs text-muted-foreground truncate">
                        {attendee.email}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Show more attendees if there are many */}
              {event.attendees.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{event.attendees.length - 5} more attendees
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meeting Link */}
        {event.htmlLink && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(event.htmlLink, '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Google Calendar
            </Button>
          </div>
        )}

        {/* Created/Updated info */}
        {(event.created || event.updated) && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            {event.created && (
              <div>Created: {format(parseISO(event.created), 'MMM dd, yyyy HH:mm')}</div>
            )}
            {event.updated && event.updated !== event.created && (
              <div>Updated: {format(parseISO(event.updated), 'MMM dd, yyyy HH:mm')}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard; 