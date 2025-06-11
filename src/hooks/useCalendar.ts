import { useState, useEffect } from 'react';
import { CalendarEvent, CalendarList, CalendarView } from '@/types/calendar';
import { calendarService } from '@/services/calendarService';

export const useCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const fetchedEvents = await calendarService.getEventsForDateRange(startDate, endDate);
      setEvents(fetchedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const fetchedCalendars = await calendarService.getCalendarList();
      setCalendars(fetchedCalendars);
    } catch (err) {
      console.error('Failed to fetch calendars:', err);
    }
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    
    switch (direction) {
      case 'prev':
        if (view === 'month') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (view === 'week') {
          newDate.setDate(newDate.getDate() - 7);
        } else if (view === 'day') {
          newDate.setDate(newDate.getDate() - 1);
        }
        break;
      case 'next':
        if (view === 'month') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (view === 'week') {
          newDate.setDate(newDate.getDate() + 7);
        } else if (view === 'day') {
          newDate.setDate(newDate.getDate() + 1);
        }
        break;
      case 'today':
        return setCurrentDate(new Date());
      default:
        return;
    }
    
    setCurrentDate(newDate);
  };

  const changeView = (newView: CalendarView) => {
    setView(newView);
  };

  const refreshEvents = () => {
    fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  useEffect(() => {
    fetchCalendars();
  }, []);

  return {
    events,
    calendars,
    loading,
    error,
    currentDate,
    view,
    navigateDate,
    changeView,
    refreshEvents,
    setCurrentDate
  };
}; 