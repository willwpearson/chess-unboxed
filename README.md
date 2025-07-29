# Chess Unboxed

A real-time multiplayer chess game built with Next.js 15, TypeScript, and Tailwind CSS. This is the frontend application that connects to a separate .NET backend API.

## 🎮 Features

- **Multiple Game Modes**:
  - **Bot Mode**: Play against AI with different difficulty levels
  - **Multiplayer**: Create or join lobbies to play against other players
  - **Endless Mode**: Challenge yourself - one loss and you're out!

- **Real-time Gameplay**: WebSocket-based communication for instant moves and updates
- **Modern UI**: Built with Tailwind CSS and responsive design
- **State Management**: Zustand for efficient state management
- **TypeScript**: Full type safety throughout the application

## 🏗️ Architecture

This is the frontend application of a distributed chess game system:

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS (this repository)
- **Backend**: .NET Core API + WebSocket server (separate repository)
- **Database**: PostgreSQL/MongoDB (managed by backend)
- **Real-time**: WebSocket communication for live gameplay

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A running .NET backend API (see backend repository)

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd chess.optim.boo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` to match your backend API URLs:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
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

## 🌐 Backend Integration

This frontend connects to a .NET backend API that handles:

- User authentication and management
- Game logic and validation
- Real-time WebSocket communication
- Lobby management
- Bot AI implementation
- Database operations

Ensure your backend is running before starting the frontend application.

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
