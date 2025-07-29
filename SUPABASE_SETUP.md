# Chess Game - Supabase Setup Instructions ✅

## Overview

Your chess game is now fully configured to work with Supabase using your exact database schema. Here's how to complete the setup:

## 🔧 Setup Steps

### 1. Environment Configuration

Create or update your `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pyncrtqwvkadrlqpdklx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
JWT_SECRET=your_jwt_secret_key_here
```

**Where to find these keys:**
- Go to your Supabase project dashboard
- Navigate to Settings > API
- Copy the "anon/public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy the "service_role" key for `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Schema (Already Created)

Your Supabase database should already have these tables with the exact schema:

```sql
-- ✅ These tables should already exist in your Supabase project
-- players, games, lobbies, endless_sessions

-- ✅ These indices should already exist
-- idx_games_player1, idx_games_player2, idx_lobbies_status, idx_endless_sessions_player
```

### 3. Test the Connection

1. **Start the development server** (if not running):
   ```bash
   npm run dev
   ```

2. **Test the health endpoint**:
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"success":true,"data":{"status":"healthy",...}}`

3. **Open the application**:
   Visit `http://localhost:3001` to see the GameModeSelector

## 🎮 Available Features

### Working API Endpoints

- **GET /api/health** - Health check
- **POST /api/players** - Create a new player
- **GET /api/players** - Get all players or specific player
- **PUT /api/players** - Update player information
- **GET /api/lobbies** - Get waiting lobbies
- **POST /api/lobbies** - Create a new lobby
- **PUT /api/lobbies** - Join lobby or update status
- **POST /api/games** - Create a new game
- **GET /api/games** - Get games by ID or player
- **PUT /api/games** - Update game state
- **GET /api/endless** - Get endless sessions
- **POST /api/endless** - Start endless session
- **PUT /api/endless** - Update endless session

### Working Components

- **GameModeSelector** - Choose between Bot, Multiplayer, and Endless modes
- **Player Creation Flow** - Automatic nickname prompt for multiplayer
- **API Integration** - All endpoints connected to Supabase

## 🧪 Testing Your Setup

### Test Player Creation
```bash
curl -X POST http://localhost:3001/api/players \
  -H "Content-Type: application/json" \
  -d '{"nickname":"TestPlayer"}'
```

### Test Lobby Creation
```bash
# First create a player, then use their ID
curl -X POST http://localhost:3001/api/lobbies \
  -H "Content-Type: application/json" \
  -d '{"host_id":"your_player_id_here"}'
```

## 🚀 Next Development Steps

### 1. Chess Board Component
Create an interactive chess board using chess.js:
```bash
# Install chess.js if not already installed
npm install chess.js
npm install @types/chess.js
```

### 2. Real-time Features
Add Supabase real-time subscriptions for:
- Live game moves
- Lobby updates
- Player status changes

### 3. Game Logic
Implement:
- Move validation
- Check/checkmate detection
- Game result handling
- Timer functionality

### 4. Bot Integration
Add chess bot AI for single-player mode:
- Different difficulty levels
- Move suggestions
- Analysis features

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot find module '@/lib/supabase'"**
   - Check that `src/lib/supabase.ts` exists
   - Verify import paths are correct

2. **"Supabase environment variables missing"**
   - Ensure `.env.local` has all required variables
   - Restart the development server after adding variables

3. **Database connection errors**
   - Verify your Supabase project is active
   - Check that the service role key has correct permissions
   - Confirm your database tables exist

4. **API endpoints returning 500 errors**
   - Check the console for detailed error messages
   - Verify your database schema matches exactly
   - Ensure all foreign key relationships are correct

### Database Verification

Check your Supabase tables have the correct structure:
```sql
-- Run these in your Supabase SQL editor to verify
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('players', 'games', 'lobbies', 'endless_sessions');

-- Check constraints
SELECT * FROM information_schema.check_constraints 
WHERE constraint_schema = 'public';
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client & TypeScript types
│   └── api.ts               # API client for all endpoints
├── app/api/                 # Next.js API routes
│   ├── players/route.ts     # Player CRUD operations
│   ├── games/route.ts       # Game management
│   ├── lobbies/route.ts     # Lobby system
│   ├── endless/route.ts     # Endless mode
│   └── health/route.ts      # Health check
└── components/game/
    └── GameModeSelector.tsx # Game mode selection UI
```

## 🎯 Your Chess Game is Ready!

Once you've added your Supabase credentials to `.env.local`, your chess game foundation is complete and ready for chess board development!

**Status**: ✅ Backend Complete | ✅ Database Integrated | 🚧 Chess Board Next
