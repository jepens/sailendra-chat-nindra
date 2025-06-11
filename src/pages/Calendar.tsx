import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, CalendarView } from '@/types/calendar';
import { calendarService } from '@/services/calendarService';
import { AgendaView } from '@/components/calendar/AgendaView';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarIcon, RefreshCw, Shield, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns';

const Calendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('agenda');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(() => {
    const authStatus = calendarService.isAuthenticated();
    setIsAuthenticated(authStatus);
    return authStatus;
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let startDate: Date;
      let endDate: Date;

      // Define date range based on current view
      switch (view) {
        case 'day':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
          break;
        case 'week':
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
          startDate = startOfWeek;
          endDate = addDays(startOfWeek, 7);
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          break;
        case 'agenda':
        default:
          // For agenda, show wider range around current date
          startDate = addDays(currentDate, -30);
          endDate = addDays(currentDate, 60);
          break;
      }
      
      const eventsData = await calendarService.getEventsForDateRange(startDate, endDate);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  const handleSignIn = useCallback(async () => {
    setError(null);
    
    try {
      if (!calendarService.isConfigured()) {
        setError('Google Calendar is not properly configured. Please check your environment variables.');
        return;
      }

      const authUrl = calendarService.getAuthUrl();
      window.location.href = authUrl;
      
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate Google Sign In');
    }
  }, []);

  const handleSignOut = useCallback(() => {
    calendarService.signOut();
    setIsAuthenticated(false);
    setEvents([]);
  }, []);



  useEffect(() => {
    const authStatus = checkAuth();
    
    if (authStatus) {
      loadEvents();
    }
  }, [checkAuth, loadEvents]);

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setView('day'); // Switch to day view when clicking on a date
  };

  const formatCurrentDate = () => {
    switch (view) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = addDays(startOfWeek, 6);
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
      default:
        return currentDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'agenda':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getViewButtons = () => {
    const views: CalendarView[] = ['month', 'week', 'day', 'agenda'];
    return views.map((viewType) => (
      <Button
        key={viewType}
        variant={view === viewType ? 'default' : 'outline'}
        size="sm"
        onClick={() => setView(viewType)}
        className="flex items-center space-x-2"
      >
        <CalendarIcon className="h-4 w-4" />
        <span className="capitalize">{viewType}</span>
      </Button>
    ));
  };

  const AuthenticationCard = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Google Calendar Authentication</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Connect your Google Calendar to view your real events and schedules.</p>
          <p className="mt-2">
            Currently showing demo data. Sign in to see your actual calendar events.
          </p>
        </div>
        
        <Button 
          onClick={handleSignIn}
          className="w-full flex items-center space-x-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Sign in with Google</span>
        </Button>
        
        <div className="text-xs text-muted-foreground">
          <p>
            We only request read-only access to your calendar data. 
            Your information is stored locally and never shared.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Calendar">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground">
              View your Google Calendar events and schedules
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEvents}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Loading...' : 'Refresh'}</span>
                </Button>

              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Authentication Status */}
        {!isAuthenticated && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You are viewing demo data. Connect your Google Calendar to see real events.
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Card (when not authenticated) */}
        {!isAuthenticated && <AuthenticationCard />}

        {/* Controls */}
        {isAuthenticated && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                  >
                    Today
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                    >
                      ←
                    </Button>
                    
                    <h2 className="text-lg font-semibold min-w-[250px] text-center">
                      {formatCurrentDate()}
                    </h2>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateDate('next')}
                    >
                      →
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getViewButtons()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {isAuthenticated && (
          <Card>
            {loading ? (
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-0">
                {view === 'agenda' && <AgendaView events={events} />}
                {view === 'month' && (
                  <MonthView events={events} currentDate={currentDate} onDateClick={handleDateClick} />
                )}
                {view === 'week' && (
                  <WeekView events={events} currentDate={currentDate} onDateClick={handleDateClick} />
                )}
                {view === 'day' && (
                  <div className="p-6">
                    <DayView events={events} currentDate={currentDate} />
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Calendar; 