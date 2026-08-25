# Chess Unboxed

A real-time multiplayer chess game built with Next.js 15, TypeScript, and Tailwind CSS. This is a full-stack application with Next.js API routes and Supabase database integration.

## 🎮 Features

- **Multiple Game Modes**:
  - **Bot Mode**: Play against AI with different difficulty levels
  - **Multiplayer**: Create or join lobbies to play against other players
  - **Endless Mode**: Challenge yourself - one loss and you're out!

- **Real-time Gameplay**: WebSocket-based communication for instant moves and updates
- **Modern UI**: Built with Tailwind CSS and responsive design
- **Database Integration**: Full Supabase PostgreSQL integration with real data
- **Player Management**: Automatic player creation and management
- **Statistics Tracking**: Live leaderboards and endless mode statistics
- **TypeScript**: Full type safety throughout the application

## 🏗️ Architecture

This is a full-stack chess game built with Next.js and Supabase:

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes for backend logic
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Real-time**: WebSocket support for live gameplay
- **Deployment**: Single Vercel deployment with Supabase integration

## ✅ Currently Working Features

### 🔗 Database Integration

- **✅ Players API**: Create, read, update players
- **✅ Lobbies API**: Create, join, and manage multiplayer lobbies
- **✅ Games API**: Track game states, moves, and results
- **✅ Endless Mode API**: Session management and scoring
- **✅ Real-time Leaderboards**: Live player rankings and statistics

### 🎯 UI Components Connected to Database

- **✅ Leaderboard**: Shows real player stats and endless mode rankings
- **✅ Lobby System**: Real lobby creation and joining with live data
- **✅ Player Management**: Automatic guest player creation
- **✅ Stats Panel**: Endless mode session tracking
- **✅ Real-time Updates**: Components refresh with live data

### 🛠️ API Client

- **✅ Type-safe API client** with error handling
- **✅ Player management hooks** for automatic initialization
- **✅ Comprehensive error handling** and loading states

## 🚧 Next Steps

### 🔮 Chess Game Implementation

- **Chess Board Component**: Interactive chess board with drag-and-drop
- **Game Logic Integration**: Connect chess.js for move validation
- **Real-time Moves**: WebSocket integration for live gameplay
- **Bot AI**: Implement chess bot with different difficulty levels

### 🎮 Game Features

- **Move History**: Visual move tracking and navigation
- **Timer System**: Configurable time controls for games
- **Game Analysis**: Post-game analysis and review
- **Tournament Mode**: Multi-player tournament brackets

### 🔐 Authentication & Social

- **User Authentication**: Proper login system with Supabase Auth
- **Player Profiles**: Detailed player statistics and history
- **Social Features**: Friend system and private matches
- **Chat System**: In-game messaging

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase project with the chess schema (see setup instructions below)

### Installation

1. Clone this repository:

```bash
git clone <your-repo-url>
cd chess.optim.boo
```

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

1. Set up environment variables:

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key_here
```

1. Set up your Supabase database:

Run this SQL in your Supabase SQL editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Players table
create table players (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp default now(),
  nickname text,
  score integer default 0,
  is_active boolean default true
);

-- Games table
create table games (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp default now(),
  ended_at timestamp,
  mode text check (mode in ('bot', 'pvp', 'endless')),
  player1_id uuid references players(id),
  player2_id uuid references players(id),
  winner_id uuid references players(id),
  status text check (status in ('in_progress', 'completed', 'abandoned')) default 'in_progress',
  moves jsonb default '[]'::jsonb
);

-- Lobbies table
create table lobbies (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp default now(),
  host_id uuid references players(id),
  guest_id uuid references players(id),
  status text check (status in ('waiting', 'full', 'in_game')) default 'waiting'
);

-- Endless sessions table
create table endless_sessions (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references players(id),
  score integer default 0,
  active boolean default true,
  started_at timestamp default now(),
  ended_at timestamp
);

-- Create indexes for performance
create index idx_games_player1 on games(player1_id);
create index idx_games_player2 on games(player2_id);
create index idx_lobbies_status on lobbies(status);
create index idx_endless_sessions_player on endless_sessions(player_id);
```

1. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing the Setup

You can test your API endpoints:

```bash
# Test health check
curl http://localhost:3000/api/health

# Create a test player
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"nickname":"TestPlayer"}'

# Get all lobbies
curl http://localhost:3000/api/lobbies
```

## 📁 Project Structure

```bash
src/
├── app/                    # Next.js 15 App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── game/              # Game-specific components
│   ├── layout/            # Layout components (Header, Footer)
│   └── providers.tsx      # App providers
├── lib/                   # Utilities and services
│   ├── api.ts            # API client
│   ├── utils.ts          # Utility functions
│   └── websocket.ts      # WebSocket service
├── store/                 # Zustand stores
│   ├── gameStore.ts      # Game state management
│   └── userStore.ts      # User state management
└── types/                 # TypeScript type definitions
    ├── api.ts            # API-related types
    ├── config.ts         # Configuration types
    └── game.ts           # Game-related types
```

## 🎯 Game Modes

### Bot Mode

- Play against AI opponents
- Multiple difficulty levels
- Perfect for practice and learning

### Multiplayer Mode

- Create or join public/private lobbies
- Real-time gameplay with other players
- Matchmaking system

### Endless Mode

- Continuous games against progressively harder opponents
- One loss ends your run
- Compete for high scores on the leaderboard

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run format` - Format code with Prettier

## 🌐 Database Integration

This application connects to a Supabase database that handles:

- Player management and profiles
- Game state and move history
- Real-time lobby system
- Endless mode session tracking
- Leaderboard and statistics

The database schema includes tables for players, games, lobbies, and endless sessions with proper relationships and constraints.

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Chess Theme**: Specialized colors and animations for chess
- **Responsive Design**: Mobile-first approach
- **Dark Mode Support**: Built-in theme switching

## 📱 Responsive Design

The application is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones
- Touch devices with drag-and-drop support

## 🔒 Security

- No sensitive data stored in frontend
- All game validation handled by backend
- WebSocket authentication
- Move validation on server-side

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t chess-frontend .
docker run -p 3000:3000 chess-frontend
```

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Repositories

- Backend API: [Link to .NET backend repository]
- Database Schema: [Link to database repository if separate]

## 📞 Support

For questions or support, please [open an issue](../../issues) or contact the development team.
