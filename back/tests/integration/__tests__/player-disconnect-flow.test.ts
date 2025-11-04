import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { GameEvents } from '../../../src/game/Events';
import { PlayerAction } from '../../../src/game/Player';

describe('Player Disconnect Flow Integration', () => {
  let io: Server;
  let server: any;
  let clientSockets: ClientSocket[] = [];

  beforeAll((done) => {
    server = createServer();
    io = new Server(server);

    // Manually set up basic event handlers for testing
    io.on('connection', (socket) => {
      socket.on('disconnect', () => {
        // Basic disconnect handling for tests
      });
    });

    server.listen(3004, done);
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  afterEach(() => {
    clientSockets.forEach(socket => socket.disconnect());
    clientSockets = [];
  });

  const createClient = (): Promise<ClientSocket> => {
    return new Promise((resolve) => {
      const client = Client('http://localhost:3004');
      client.on('connect', () => {
        clientSockets.push(client);
        resolve(client);
      });
    });
  };

  describe('Complete Disconnect Flow', () => {
    it('should handle full player disconnect lifecycle', async () => {
      // Create three clients: 2 players + 1 observer
      const player1Client = await createClient();
      const player2Client = await createClient();
      const observerClient = await createClient();

      const gameId = 'disconnect-flow-game';
      const player1Id = 'disconnect-player-1';
      const player2Id = 'disconnect-player-2';
      const observerId = 'disconnect-observer';

      // All clients join the game
      const joinPromises = [
        player1Client,
        player2Client,
        observerClient
      ].map((client, index) => {
        const playerId = index === 0 ? player1Id : index === 1 ? player2Id : observerId;
        const playerName = `Player ${index + 1}`;

        return new Promise<void>((resolve) => {
          client.emit(GameEvents.JOIN_GAME, {
            gameId,
            playerId,
            playerName
          });

          // Wait a bit for join to process
          setTimeout(resolve, 50);
        });
      });

      await Promise.all(joinPromises);

      // Start the game
      player1Client.emit(GameEvents.START_GAME, { gameId });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set up event tracking
      const eventsReceived: any[] = [];
      const trackEvent = (eventType: string) => (data: any) => {
        eventsReceived.push({ type: eventType, data, timestamp: Date.now() });
      };

      // Track events on observer client
      observerClient.on(GameEvents.PLAYER_OFFLINE, trackEvent(GameEvents.PLAYER_OFFLINE));
      observerClient.on(GameEvents.TURN_TIMEOUT, trackEvent(GameEvents.TURN_TIMEOUT));
      observerClient.on(GameEvents.UPDATE_GAME_STATE, trackEvent(GameEvents.UPDATE_GAME_STATE));
      observerClient.on(GameEvents.PLAYER_LEFT_GAME, trackEvent(GameEvents.PLAYER_LEFT_GAME));

      // Track events on player2 client
      player2Client.on(GameEvents.PLAYER_OFFLINE, trackEvent(GameEvents.PLAYER_OFFLINE));
      player2Client.on(GameEvents.TURN_TIMEOUT, trackEvent(GameEvents.TURN_TIMEOUT));

      console.log('🔄 Starting disconnect flow test...');

      // Phase 1: Disconnect player1
      console.log('📴 Disconnecting player1...');
      player1Client.disconnect();

      // Wait for PLAYER_OFFLINE event
      await new Promise(resolve => setTimeout(resolve, 500));

      const offlineEvents = eventsReceived.filter(e => e.type === GameEvents.PLAYER_OFFLINE);
      expect(offlineEvents.length).toBeGreaterThan(0);
      expect(offlineEvents.some(e => e.data.playerId === player1Id)).toBe(true);

      console.log('✅ PLAYER_OFFLINE events received');

      // Phase 2: Wait for turn timeout (30 seconds)
      console.log('⏰ Waiting for turn timeout...');
      await new Promise(resolve => setTimeout(resolve, 32000));

      const timeoutEvents = eventsReceived.filter(e => e.type === GameEvents.TURN_TIMEOUT);
      expect(timeoutEvents.length).toBeGreaterThan(0);

      const lastTimeout = timeoutEvents[timeoutEvents.length - 1];
      expect(lastTimeout.data.playerId).toBe(player1Id);
      expect(lastTimeout.data.timeoutCount).toBe(1);
      expect(Object.values(PlayerAction)).toContain(lastTimeout.data.actionPerformed);

      console.log(`✅ TURN_TIMEOUT received: ${lastTimeout.data.actionPerformed}`);

      // Phase 3: Verify game state updates occurred
      const gameStateUpdates = eventsReceived.filter(e => e.type === GameEvents.UPDATE_GAME_STATE);
      expect(gameStateUpdates.length).toBeGreaterThan(0);

      console.log('✅ Game state updates received');

      // Phase 4: Wait for grace period to expire (additional 30 seconds from offline event)
      console.log('⏳ Waiting for grace period to expire...');
      await new Promise(resolve => setTimeout(resolve, 32000));

      const leftEvents = eventsReceived.filter(e => e.type === GameEvents.PLAYER_LEFT_GAME);
      expect(leftEvents.length).toBeGreaterThan(0);
      expect(leftEvents.some(e => e.data.playerId === player1Id)).toBe(true);

      console.log('✅ PLAYER_LEFT_GAME event received');

    }, 80000); // Extended timeout for disconnect flow

    it('should handle multiple disconnections correctly', async () => {
      // Test multiple players disconnecting in sequence
      const clients = await Promise.all([
        createClient(),
        createClient(),
        createClient(),
        createClient()
      ]);

      const gameId = 'multi-disconnect-game';
      const playerIds = ['multi-p1', 'multi-p2', 'multi-p3', 'multi-p4'];

      // Join game
      clients.forEach((client, index) => {
        client.emit(GameEvents.JOIN_GAME, {
          gameId,
          playerId: playerIds[index],
          playerName: `Multi Player ${index + 1}`
        });
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Start game
      clients[0].emit(GameEvents.START_GAME, { gameId });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Track offline events
      const offlineEvents: string[] = [];
      clients.forEach(client => {
        client.on(GameEvents.PLAYER_OFFLINE, (data) => {
          offlineEvents.push(data.playerId);
        });
      });

      // Disconnect players one by one with delays
      clients[0].disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));

      clients[1].disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should have received offline events for both players
      expect(offlineEvents).toContain('multi-p1');
      expect(offlineEvents).toContain('multi-p2');

      // Disconnect remaining players
      clients[2].disconnect();
      clients[3].disconnect();
    });
  });
});
