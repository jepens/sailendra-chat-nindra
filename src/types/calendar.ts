export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
  created?: string;
  updated?: string;
  htmlLink?: string;
  creator?: {
    email?: string;
    displayName?: string;
  };
  organizer?: {
    email?: string;
    displayName?: string;
  };
}

export interface CalendarList {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
}

export class CalendarError extends Error {
  code?: number;
  details?: any;

  constructor({ message, code, details }: { message: string; code?: number; details?: any }) {
    super(message);
    this.name = 'CalendarError';
    this.code = code;
    this.details = details;
  }
}

export interface CalendarConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface CalendarQuery {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  showDeleted?: boolean;
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'; 