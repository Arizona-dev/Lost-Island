# Skironia Island Backend - Presence & Lobby Management

This document describes the implementation of presence tracking, host management, and automatic lobby cleanup for the Skironia Island game backend.

## Overview

The system now handles player disconnects gracefully, manages host transfers, and cleans up abandoned games. Key features include:

- **Presence Tracking**: Real-time online/offline status with Redis-backed persistence
- **Grace Periods**: 60-second reconnection window before player removal
- **Host Transfer**: Automatic host reassignment when the current host leaves
- **Auto Cleanup**: Empty games are automatically removed from database and Redis
- **Turn Safety**: Proper turn management when players are removed mid-game

## New Events

### Presence Events
```typescript
PLAYER_OFFLINE: { playerId: string }
PLAYER_ONLINE: { playerId: string }
```

Emitted when players disconnect/reconnect. Clients should update UI to show offline players differently (grayed out, "offline" indicator, etc.).

### Host Management Events
```typescript
HOST_CHANGED: { newHostId: string; newHostName: string }
```

Emitted when host transfers occur. Clients should update host indicators and permissions.

### Game Lifecycle Events
```typescript
LOBBY_CLOSED: { gameId: string }
```

Emitted when empty lobbies are cleaned up. Clients should redirect users away from closed games.

## Core Services

### Presence Service (`presenceService.ts`)

Manages player online/offline status with Redis persistence.

```typescript
// Mark player as online (clears grace timer)
markOnline(gameId: string, playerId: string): Promise<void>

// Mark player as offline (starts grace timer)
markOffline(gameId: string, playerId: string): Promise<void>

// Start grace timer (60s default)
startGraceTimer(gameId, playerId, ms, onExpire): void

// Clear existing grace timer
clearGraceTimer(gameId: string, playerId: string): void

// Get current presence data
getPresence(gameId: string, playerId: string): Promise<PresenceData | null>
```

**Redis Storage**: `presence:game:{gameId}:player:{playerId}`
```json
{
  "status": "online" | "offline",
  "lastSeen": 1234567890
}
```

### Game Service Enhancements (`gameService.ts`)

#### Enhanced `leaveGameService()`
Now handles complete player removal workflow:
1. Removes from MongoDB
2. Updates Redis game state
3. Transfers host if needed
4. Cleans up empty games

#### `assignNewHost(game: IGame): Promise<IGame>`
Transfers host to the first remaining player and emits `HOST_CHANGED`.

#### `deleteGameAndState(id: string, wasStarted: boolean): Promise<void>`
Removes game from both MongoDB and Redis, emits appropriate cleanup event.

### Game State Management (`Game.ts`)

#### `removePlayerFromState(gameState: GameState, playerId: string): GameState`
Safely removes a player from game state:
- Filters out the player
- Handles turn rotation if removed player was current
- Ends game if no players remain

#### `removePlayerFromGame(gameId: string, playerId: string): Promise<GameState>`
Persists player removal to Redis and emits `PLAYER_LEFT` event.

## Socket Integration

### Connection Flow
```
Client Connects → JOIN_GAME
    ↓
markOnline(gameId, playerId)
clearGraceTimer(gameId, playerId)
emit PLAYER_ONLINE
```

### Disconnection Flow
```
Client Disconnects
    ↓
markOffline(gameId, playerId)
startGraceTimer(60s)
emit PLAYER_OFFLINE

    ↓ (after 60s if not reconnected)
leaveGameService(gameId, playerId)
```

### Explicit Leave Flow
```
Client Leaves → LEAVE_GAME
    ↓
leaveGameService(gameId, playerId)
    ↓
Remove from DB + Redis
Transfer host if needed
Clean up if empty
```

## Configuration

### Grace Period
```typescript
// In websocket/index.ts
startGraceTimer(gameRoom, playerId, 60000, onExpire) // 60 seconds
```

To change the grace period, modify the `60000` value (milliseconds).

### Host Transfer Logic
When a host leaves, the system assigns the first remaining player as the new host. This is handled in `assignNewHost()`.

## Game State Behavior

### During Lobby (status: "created")
- Players can join/leave freely
- Host transfer occurs immediately
- Empty lobbies are cleaned up automatically

### During Game (status: "started")
- Players can still leave (grace period applies)
- Host transfer occurs but game continues
- Empty games are ended and cleaned up

### Turn Management
When a player is removed mid-game:
1. If they were the current player, turn passes to next alive player
2. Turn order preserves original player arrangement
3. Game continues until only one player remains

## Database Schema

### Game Model
```typescript
interface IGame {
  partyOwner: { id: string; name: string }; // Can change dynamically
  players: IPlayer[];
  status: "created" | "started" | "finished";
  // ... other fields
}
```

### Presence Data (Redis)
```typescript
interface PresenceData {
  status: "online" | "offline";
  lastSeen: number; // timestamp
}
```

## Error Handling

- **Redis failures**: Logged but don't break game flow
- **Database errors**: Player removal fails gracefully
- **Timer issues**: Grace periods continue working
- **Host transfer failures**: Game continues with current host

## Client Integration

### Recommended UI Updates
```javascript
// Listen for presence events
socket.on('PLAYER_OFFLINE', ({ playerId }) => {
  // Gray out player in UI
  // Show "Player offline" indicator
});

socket.on('PLAYER_ONLINE', ({ playerId }) => {
  // Restore normal player appearance
});

socket.on('HOST_CHANGED', ({ newHostId, newHostName }) => {
  // Update host crown indicator
  // Enable/disable host-only controls
});

socket.on('LOBBY_CLOSED', ({ gameId }) => {
  // Redirect to lobby list
  // Show "Game closed" message
});
```

### Handling Reconnection
When a client reconnects within the grace period:
1. `PLAYER_ONLINE` event is emitted
2. Player retains their position in game
3. Turn continues normally

## Monitoring & Debugging

### Redis Keys to Monitor
- `presence:game:*:player:*` - Player presence status
- `game:*` - Game state
- `lock:game:*` - Game state locks

### Log Messages
- `[WS]: Player X marked online in game Y`
- `[WS]: Grace period expired for player X in game Y`
- `Host changed to Player X`

## Testing Scenarios

### Network Interruption
1. Player disconnects briefly (< 60s)
2. UI shows offline status
3. Player reconnects → back online
4. Game continues uninterrupted

### Host Leaves During Lobby
1. Host disconnects or leaves
2. `HOST_CHANGED` event emitted
3. First remaining player becomes host
4. Lobby continues normally

### All Players Leave
1. Last player leaves
2. Game marked as ended
3. Database and Redis entries cleaned up
4. `LOBBY_CLOSED`/`GAME_ENDED` emitted

### Mid-Game Disconnection
1. Player disconnects during their turn
2. After grace period, player removed
3. Turn passes to next player
4. Game continues with remaining players

## Future Enhancements

- **Configurable grace periods** per game settings
- **Host voting** for controversial decisions
- **Spectator mode** for disconnected players
- **Connection quality indicators** based on ping
- **Automatic game pausing** during mass disconnections
