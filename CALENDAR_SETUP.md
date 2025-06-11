# Google Calendar Integration Setup

Fitur Calendar pada aplikasi Nindra Chatbot System memungkinkan Anda untuk melihat jadwal dari Google Calendar. Berikut adalah langkah-langkah untuk mengonfigurasi integrasi Google Calendar.

## Prerequisites

1. Akun Google dengan Google Calendar
2. Google Cloud Project
3. API Key atau OAuth 2.0 credentials

## Setup Google Calendar API

### 1. Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik "Create Project" atau pilih project yang sudah ada
3. Berikan nama project (contoh: "Nindra Calendar")
4. Klik "Create"

### 2. Enable Google Calendar API

1. Di Google Cloud Console, buka "APIs & Services" > "Library"
2. Cari "Google Calendar API"
3. Klik pada "Google Calendar API"
4. Klik "Enable"

### 3. Buat Credentials

#### Option A: API Key (Read-only, Public calendars)
1. Buka "APIs & Services" > "Credentials"
2. Klik "Create Credentials" > "API Key"
3. Copy API Key yang dibuat
4. (Optional) Restrict API key untuk Google Calendar API saja

#### Option B: OAuth 2.0 (Recommended for private calendars)
1. Buka "APIs & Services" > "Credentials"
2. Klik "Create Credentials" > "OAuth client ID"
3. Pilih "Web application"
4. Tambahkan authorized JavaScript origins:
   - `http://localhost:5173` (untuk development)
   - `https://yourdomain.com` (untuk production)
5. Tambahkan authorized redirect URIs:
   - `http://localhost:5173/calendar` (untuk development)
   - `https://yourdomain.com/calendar` (untuk production)
6. Copy Client ID dan Client Secret

## Konfigurasi Environment Variables

Copy file `env.example` menjadi `.env` di root project dan isi dengan kredensial Anda:

```env
# Google Calendar API Configuration
VITE_GOOGLE_CALENDAR_API_KEY=your_api_key_here
VITE_GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here

# Existing Supabase config
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Implementasi Real Google Calendar API

Aplikasi telah dikonfigurasi untuk menggunakan Google Calendar REST API langsung tanpa library tambahan. Implementasi ini kompatibel dengan browser dan tidak memerlukan setup Node.js library.

### Browser-Compatible Implementation

CalendarService menggunakan:
- **Fetch API** untuk REST calls ke Google Calendar API
- **OAuth 2.0 flow** untuk authentication
- **localStorage** untuk token storage
- **Graceful fallback** ke mock data jika tidak authenticated

### Cara Kerja OAuth Flow

1. User klik "Sign in with Google"
2. Redirect ke Google OAuth authorization page
3. User authorize aplikasi
4. Google redirect kembali dengan authorization code
5. Aplikasi exchange code untuk access token
6. Token disimpan di localStorage untuk session persistence

### API Endpoints yang Digunakan

Aplikasi menggunakan Google Calendar REST API endpoints berikut:

1. **OAuth Token Exchange**:
   ```
   POST https://oauth2.googleapis.com/token
   ```

2. **Calendar List**:
   ```
   GET https://www.googleapis.com/calendar/v3/users/me/calendarList
   ```

3. **Calendar Events**:
   ```
   GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
   ```

### Token Management

- **Storage**: Tokens disimpan di browser localStorage
- **Expiry**: Automatic token expiry detection
- **Security**: Read-only access dengan minimal scopes

## Fitur yang Tersedia

### Current Features
1. **Agenda View**: Menampilkan events dalam format list
2. **Multiple View Support**: Month, Week, Day, Agenda (hanya Agenda yang aktif)
3. **Event Details**: Menampilkan title, description, time, location, attendees
4. **Navigation**: Previous/Next month, Today button
5. **Responsive Design**: Mobile-friendly interface

### Planned Features
1. **Month Grid View**: Calendar grid dengan events
2. **Week View**: Weekly calendar layout
3. **Day View**: Detailed daily schedule
4. **Event Creation**: Tambah event baru (jika menggunakan OAuth)
5. **Multiple Calendar Support**: Pilih calendar mana yang ditampilkan
6. **Event Sync**: Real-time sync dengan Google Calendar
7. **Push Notifications**: Notifikasi untuk upcoming events

## Development Notes

### Mock Data
Aplikasi saat ini menggunakan mock data untuk development. Mock data mencakup:
- 3 sample calendars (Personal, Work, Family)
- 3 sample events dengan berbagai tipe (meeting, deadline, presentation)
- Different event types (all-day events, timed events)

### File Structure
```
src/
├── types/calendar.ts           # TypeScript interfaces
├── services/calendarService.ts # API service layer
├── components/calendar/        # Calendar components
│   ├── AgendaView.tsx         # List view component
│   ├── CalendarGrid.tsx       # Month grid component
│   ├── CalendarHeader.tsx     # Header with navigation
│   └── EventCard.tsx          # Individual event component
├── hooks/useCalendar.ts       # Custom calendar hook
└── pages/Calendar.tsx         # Main calendar page
```

## Testing

1. Start development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/calendar` route
3. Test different views and navigation
4. Verify events display correctly

## Production Deployment

1. Update environment variables dengan production values
2. Ensure Google Cloud project has production domain authorized
3. Test OAuth flow di production environment
4. Monitor API usage dan quotas

## Troubleshooting

### Common Issues

1. **API Key tidak bekerja**
   - Pastikan Google Calendar API sudah enabled
   - Check API key restrictions
   - Verify domain authorization

2. **OAuth errors**
   - Check redirect URIs di Google Cloud Console
   - Ensure client ID dan secret benar
   - Verify scopes yang diminta

3. **Events tidak muncul**
   - Check calendar permissions
   - Verify calendar ID
   - Ensure date range benar

### Debug Mode

Enable debug logging dengan menambahkan di `.env`:
```env
VITE_DEBUG_CALENDAR=true
```

## Security Considerations

1. **API Keys**: Jangan commit API keys ke version control
2. **Client Secrets**: Store di environment variables
3. **CORS**: Configure proper CORS settings
4. **Rate Limiting**: Monitor API usage untuk avoid quota limits
5. **User Data**: Handle user calendar data dengan hati-hati

## Support

Untuk bantuan lebih lanjut:
1. Check [Google Calendar API Documentation](https://developers.google.com/calendar)
2. Review error logs di browser console
3. Contact development team untuk issues specific aplikasi

---

Created by Bedul Tampan © 2025 Nindra Chatbot System 