# Backend Tests

This directory contains comprehensive tests for the Skironia Island backend, covering socket events, game logic, and integration flows.

## Test Structure

```
tests/
├── setup.ts                    # Jest setup and database mocking
├── websocket/
│   └── __tests__/
│       ├── presence.test.ts    # Socket presence system tests
│       └── turn-timeout.test.ts # Turn timeout and random actions
├── game/
│   └── __tests__/
│       └── game-logic.test.ts  # Core game logic tests
└── integration/
    └── __tests__/
        └── player-disconnect-flow.test.ts # Full disconnect lifecycle
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

## Test Categories

### 1. Presence System Tests (`presence.test.ts`)
- ✅ PLAYER_OFFLINE events sent to other players on disconnect
- ✅ PLAYER_OFFLINE not sent for multiple tabs of same player
- ✅ Proper socket room management
- ✅ Disconnect reason handling

### 2. Turn Timeout Tests (`turn-timeout.test.ts`)
- ✅ TURN_TIMEOUT events after 30 seconds for disconnected players
- ✅ Random action execution (FISH, COLLECT_WATER, COLLECT_WOOD)
- ✅ Turn advancement after timeout
- ✅ Turn skipping after 2 timeouts
- ✅ Game state updates during timeouts

### 3. Game Logic Tests (`game-logic.test.ts`)
- ✅ Game state creation and management
- ✅ Player joining and game state updates
- ✅ Player actions (FISH, COLLECT_WATER, COLLECT_WOOD)
- ✅ Action validation and error handling
- ✅ Turn management and player ordering

### 4. Integration Tests (`player-disconnect-flow.test.ts`)
- ✅ Complete player disconnect lifecycle
- ✅ Event sequencing (OFFLINE → TIMEOUT → LEFT)
- ✅ Multiple player disconnections
- ✅ Real-time event propagation

## Test Environment

- **Database**: MongoDB Memory Server (no persistence)
- **Redis**: In-memory Redis instance
- **Socket.IO**: Test server on configurable ports
- **Timeouts**: Extended for real-time event testing

## Key Features Tested

### Socket Events
- PLAYER_OFFLINE, PLAYER_ONLINE, PLAYER_LEFT_GAME
- TURN_TIMEOUT with action information
- UPDATE_GAME_STATE, GAME_STARTED, GAME_ENDED
- Host changes and lobby management

### Game Logic
- Player actions and resource management
- Turn order and game state transitions
- Random action execution for disconnected players
- Timeout handling and turn skipping

### Presence System
- Online/offline status tracking
- Grace period management (30 seconds)
- Multiple connection handling
- Socket cleanup and tracking

### Integration Flows
- Full disconnect-to-reconnect cycle
- Concurrent player management
- Real-time event synchronization
- Error handling and recovery

## Test Utilities

- **Socket.IO Test Clients**: Automated client creation and event handling
- **Database Mocking**: Clean state between tests
- **Async Helpers**: Proper timing for real-time events
- **Event Tracking**: Comprehensive event logging and verification

## Coverage Goals

- **Socket Events**: 100% event handler coverage
- **Game Logic**: All core functions and edge cases
- **Presence System**: All connection states and transitions
- **Integration**: End-to-end user flows

Run `npm run test:coverage` to see detailed coverage reports.
