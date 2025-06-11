import { CalendarEvent, CalendarList, CalendarQuery, CalendarError } from '@/types/calendar';

class CalendarService {
  private apiKey: string;
  private clientId: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
    this.clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
    
    // Check for stored access token
    this.loadStoredToken();
  }

  // Load stored access token from localStorage
  private loadStoredToken() {
    try {
      const storedToken = localStorage.getItem('google_calendar_token');
      
      if (storedToken) {
        const tokenData = JSON.parse(storedToken);
        this.accessToken = tokenData.access_token;
        this.tokenExpiry = tokenData.expiry_date;
        
        if (this.tokenExpiry) {
          // Check if token is expired (with 5 minute buffer)
          if (Date.now() >= (this.tokenExpiry - 5 * 60 * 1000)) {
            this.signOut();
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored token:', error);
      localStorage.removeItem('google_calendar_token');
      this.accessToken = null;
      this.tokenExpiry = null;
    }
  }

  // Save access token to localStorage
  private saveToken(tokens: any) {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      throw new CalendarError({
        message: 'Browser storage is not available'
      });
    }
    
    const expiryDate = tokens.expiry_date || (Date.now() + (tokens.expires_in * 1000));
    
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: expiryDate,
      token_type: tokens.token_type || 'Bearer',
      saved_at: Date.now()
    };
    
    try {
      localStorage.setItem('google_calendar_token', JSON.stringify(tokenData));
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = tokenData.expiry_date;
    } catch (error) {
      console.error('Error saving token to localStorage:', error);
      throw new CalendarError({
        message: 'Failed to save authentication token'
      });
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken && (!this.tokenExpiry || Date.now() < this.tokenExpiry);
  }

  // Check if Google Calendar credentials are configured
  isConfigured(): boolean {
    return !!(this.apiKey && this.clientId);
  }

  // Get OAuth URL for authentication
  getAuthUrl(): string {
    if (!this.clientId) {
      throw new Error('Google Calendar Client ID not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly'
    ].join(' ');

    const redirectUri = `${window.location.origin}/calendar/callback`;
    const state = Math.random().toString(36).substring(2, 15);

    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      state: state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleOAuthCallback(code: string, state?: string): Promise<void> {
    const savedState = sessionStorage.getItem('oauth_state');
    
    if (savedState && state && savedState !== state) {
      throw new CalendarError({
        message: 'Security validation failed - state mismatch'
      });
    }
    
    if (!code) {
      throw new CalendarError({
        message: 'No authorization code received from Google'
      });
    }

    if (!this.clientId) {
      throw new CalendarError({
        message: 'Google Calendar Client ID not configured'
      });
    }

    try {
      const redirectUri = `${window.location.origin}/calendar/callback`;
      
      const tokenRequestBody = {
        client_id: this.clientId,
        client_secret: import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      };

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenRequestBody).toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
      }

      const tokenData = await response.json();

      if (!tokenData.access_token) {
        throw new Error('No access token received from Google');
      }

      // Clear the state from session storage
      sessionStorage.removeItem('oauth_state');

      // Save tokens
      this.saveToken(tokenData);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new CalendarError({
        message: error instanceof Error ? error.message : 'Failed to handle OAuth callback'
      });
    }
  }

  // Sign out user
  signOut(): void {
    localStorage.removeItem('google_calendar_token');
    sessionStorage.removeItem('oauth_state');
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Public method to reload token from storage
  public reloadTokenFromStorage(): void {
    this.loadStoredToken();
  }

  // Make authenticated API request
  private async makeApiRequest(url: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new CalendarError({
        message: 'Not authenticated with Google Calendar'
      });
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.signOut();
        throw new CalendarError({
          message: 'Authentication expired. Please sign in again.'
        });
      }
      
      if (response.status === 403) {
        throw new CalendarError({
          message: 'Permission denied. Calendar access may not be granted.'
        });
      }
      
      throw new CalendarError({
        message: `API error: ${response.status} - ${response.statusText}`
      });
    }

    return response.json();
  }

  // Get list of calendars
  async getCalendarList(): Promise<CalendarList[]> {
    if (!this.isAuthenticated()) {
      return this.getMockCalendars();
    }

    try {
      const url = `https://www.googleapis.com/calendar/v3/users/me/calendarList`;
      const data = await this.makeApiRequest(url);
      
      return data.items?.map((item: any) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        primary: item.primary,
        backgroundColor: item.backgroundColor,
        foregroundColor: item.foregroundColor,
        selected: true
      })) || [];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw new CalendarError({
        message: 'Failed to fetch calendar list'
      });
    }
  }

  // Get events with optional query parameters
  async getEvents(query: CalendarQuery = {}): Promise<CalendarEvent[]> {
    if (!this.isAuthenticated()) {
      return this.getMockEvents();
    }

    try {
      const {
        calendarId = 'primary',
        timeMin,
        timeMax,
        maxResults = 100,
        orderBy = 'startTime',
        singleEvents = true,
        showDeleted = false
      } = query;

      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        orderBy,
        singleEvents: singleEvents.toString(),
        showDeleted: showDeleted.toString(),
      });

      if (timeMin) {
        params.append('timeMin', timeMin);
      }

      if (timeMax) {
        params.append('timeMax', timeMax);
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
      
      const data = await this.makeApiRequest(url);

      const mappedEvents = data.items?.map((item: any) => ({
        id: item.id,
        summary: item.summary || 'No title',
        description: item.description,
        start: item.start,
        end: item.end,
        location: item.location,
        status: item.status,
        htmlLink: item.htmlLink,
        created: item.created,
        updated: item.updated,
        creator: item.creator,
        organizer: item.organizer,
        attendees: item.attendees?.map((attendee: any) => ({
          email: attendee.email,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus,
          optional: attendee.optional,
          resource: attendee.resource,
          comment: attendee.comment,
          additionalGuests: attendee.additionalGuests
        })) || [],
        reminders: item.reminders,
        recurringEventId: item.recurringEventId,
        originalStartTime: item.originalStartTime,
        transparency: item.transparency,
        visibility: item.visibility,
        iCalUID: item.iCalUID,
        sequence: item.sequence,
        hangoutLink: item.hangoutLink,
        conferenceData: item.conferenceData,
        gadget: item.gadget,
        anyoneCanAddSelf: item.anyoneCanAddSelf,
        guestsCanInviteOthers: item.guestsCanInviteOthers,
        guestsCanModify: item.guestsCanModify,
        guestsCanSeeOtherGuests: item.guestsCanSeeOtherGuests,
        privateCopy: item.privateCopy,
        locked: item.locked,
        colorId: item.colorId
      })) || [];
      
      return mappedEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new CalendarError({
        message: 'Failed to fetch calendar events'
      });
    }
  }

  // Mock data for when not authenticated
  private getMockCalendars(): CalendarList[] {
    return [
      {
        id: 'primary',
        summary: 'My Calendar',
        description: 'Main calendar',
        primary: true,
        backgroundColor: '#ac725e',
        foregroundColor: '#ffffff',
        selected: true
      }
    ];
  }

  private getMockEvents(): CalendarEvent[] {
    const now = new Date();
    return [
      {
        id: 'demo-1',
        summary: 'Team Meeting (Demo)',
        description: 'Weekly team standup meeting',
        start: {
          dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Jakarta'
        },
        end: {
          dateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Jakarta'
        },
        location: 'Meeting Room A',
        status: 'confirmed',
        htmlLink: '#',
        created: now.toISOString(),
        updated: now.toISOString(),
        organizer: {
          email: 'organizer@example.com',
          displayName: 'John Doe'
        },
        attendees: [
          {
            email: 'attendee1@example.com',
            displayName: 'Alice Smith',
            responseStatus: 'accepted'
          },
          {
            email: 'attendee2@example.com',
            displayName: 'Bob Johnson',
            responseStatus: 'tentative'
          }
        ]
      }
    ];
  }

  // Utility methods for date ranges
  async getEventsForDateRange(startDate: Date, endDate: Date, calendarId = 'primary'): Promise<CalendarEvent[]> {
    return this.getEvents({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 250
    });
  }

  async getTodayEvents(calendarId = 'primary'): Promise<CalendarEvent[]> {
    const today = new Date();
    return this.getEventsForDateRange(today, today, calendarId);
  }

  async getWeekEvents(calendarId = 'primary'): Promise<CalendarEvent[]> {
    const today = new Date();
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this.getEventsForDateRange(today, weekEnd, calendarId);
  }

  // Utility methods for formatting
  formatEventTime(event: CalendarEvent): string {
    if (event.start?.dateTime) {
      const startTime = new Date(event.start.dateTime);
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
      
      const timeFormat: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      
      if (endTime) {
        return `${startTime.toLocaleTimeString('en-US', timeFormat)} - ${endTime.toLocaleTimeString('en-US', timeFormat)}`;
      }
      return startTime.toLocaleTimeString('en-US', timeFormat);
    }
    return 'All day';
  }

  formatEventDate(event: CalendarEvent): string {
    const dateString = event.start?.dateTime || event.start?.date;
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Export singleton instance
export const calendarService = new CalendarService(); 