# Skironia Island

A multiplayer survival game where players must work together to survive on a deserted island and build a raft to escape before a hurricane arrives.

## 🎮 Game Overview

After their shipwreck, a group of survivors finds themselves on a deserted island. The setting is paradisiacal but life is difficult. Water flows according to sparse rainfall and fish are scarce. It's uncertain if everyone will survive this regime...

The only solution: build a raft together. But don't wait too long, as clouds on the horizon indicate the imminent arrival of a dangerous hurricane!

## 🏗️ Project Structure

This is a full-stack application with separate frontend and backend:

```
Sirkonia/
├── back/              # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── game/           # Game logic and state management
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions (logger, etc.)
│   │   ├── websocket/      # Socket.io event handlers
│   │   └── server.ts       # Application entry point
│   └── package.json
│
├── front/             # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── views/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── config/        # Frontend configuration
│   │   ├── utils/         # Utility functions
│   │   └── main.tsx        # Application entry point
│   └── package.json
│
├── docker-compose.yml # Docker configuration for MongoDB and Redis
└── README.md         # This file
```

## 📋 Prerequisites

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **MongoDB** (local or cloud instance)
- **Redis** (for game state management)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Sirkonia
```

### 2. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts MongoDB and Redis containers.

### 3. Setup Backend

```bash
cd back

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your MongoDB URI and other settings
# Then start the backend
npm run dev
```

The backend will run on `http://localhost:3000`

### 4. Setup Frontend

Open a new terminal:

```bash
cd front

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `back` directory (use `.env.example` as a template):

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sirkonia

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend Configuration

The frontend API URL is configured in `front/src/config/index.ts`. By default, it points to `http://localhost:3000`. Modify this if your backend runs on a different URL.

## 📝 Available Scripts

### Backend (`back/`)

- `npm start` - Start the production server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for TypeScript changes and recompile
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run clean` - Remove build directory

### Frontend (`front/`)

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Tech Stack

### Backend
- **Express.js** - Web framework
- **Socket.io** - Real-time WebSocket communication
- **MongoDB** - Database (via Mongoose)
- **Redis** - Caching and game state management
- **TypeScript** - Type safety
- **Winston** - Logging

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **React Router** - Routing
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client

## 🔌 API Endpoints

### Games
- `POST /api/games/create` - Create a new game
- `GET /api/games` - Get all games
- `GET /api/games/:id/:password?` - Get game details
- `POST /api/games/:id/join` - Join a game
- `POST /api/games/:id/start` - Start a game

## 🔐 Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

## 🐳 Docker Support

The project includes a `docker-compose.yml` file for easy setup of MongoDB and Redis:

```bash
docker-compose up -d
```

This starts:
- MongoDB on port `27017`
- Redis on port `6379`

## 🎮 How to Play

1. **Create or Join a Game**: Start by creating a new game or joining an existing one
2. **Wait for Players**: The game starts when enough players join
3. **Survive**: Each turn, players must collect resources (water, food, wood)
4. **Build the Raft**: Work together to build a raft before the hurricane arrives
5. **Escape**: The first players to escape on the raft win!

## 🔒 Security Notes

- Never commit `.env` files with actual credentials
- Use environment variables for all sensitive data
- Ensure MongoDB has proper authentication enabled
- Configure CORS appropriately for production
- Use HTTPS in production

## 📦 Dependencies

### Backend Production Dependencies
- `express` - Web framework
- `socket.io` - WebSocket server
- `mongoose` - MongoDB ODM
- `ioredis` - Redis client
- `cors` - CORS middleware
- `dotenv` - Environment variable management
- `winston` - Logging library

### Frontend Production Dependencies
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing
- `socket.io-client` - WebSocket client
- `axios` - HTTP client
- `tailwindcss` - CSS framework

## 🤝 Contributing

[Contributing guidelines here]

## 📄 License

[Your License Here]

## 📞 Support

[Support information here]
