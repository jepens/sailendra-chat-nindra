# Sailendra Chat Nexus

A modern chat application built with React, TypeScript, and Supabase.

## Features

- Real-time chat functionality
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
   git clone https://github.com/your-username/sailendra-chat-nexus.git
   cd sailendra-chat-nexus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

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
sailendra-chat-nexus/
├── src/
│   ├── components/     # React components
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

Created by Bedul Tampan © 2025 Sailendra Organizer
