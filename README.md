# Nindra Chatbot System

A modern chat application built with React, TypeScript, and Supabase.

## Features

- Real-time chat functionality
- Google Calendar integration for viewing schedules
- Contacts management
- Activity logs tracking
- Modern UI with Shadcn/UI components
- Dark/Light theme support
- Responsive design
- Docker support
- TypeScript for type safety

## Tech Stack

- React.js
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Supabase
- Docker
- Vite

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Docker (optional)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nindra-chatboy-system.git
   cd nindra-chatboy-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Calendar Integration (Optional)
   VITE_GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
   VITE_GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
   ```

   For Google Calendar setup, see [CALENDAR_SETUP.md](./CALENDAR_SETUP.md)

## Development

Run the development server:
```bash
npm run dev
```

## Production Build

Build the application:
```bash
npm run build
```

## Docker Deployment

Build and run with Docker:
```bash
docker-compose up --build
```

The application will be available at `http://localhost:8080`

## Project Structure

```
nindra-chatboy-system/
├── src/
│   ├── components/     # React components
│   │   ├── calendar/  # Calendar-specific components
│   │   ├── chat/      # Chat-related components
│   │   ├── layouts/   # Layout components
│   │   └── ui/        # Reusable UI components
│   ├── contexts/       # React contexts
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   ├── services/      # API services
│   └── types/         # TypeScript types
├── public/            # Static files
└── supabase/         # Supabase configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Credits

Created by Bedul Tampan © 2025 Nindra Chatbot System
