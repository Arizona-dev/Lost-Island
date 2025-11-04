import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { GameEvents } from '../../../src/game/Events';
import { PlayerAction } from '../../../src/game/Player';
import { describe, it, beforeAll, afterAll, afterEach, expect } from '@jest/globals';

describe('Turn Timeout System', () => {
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

    server.listen(3002, done);
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
      const client = Client('http://localhost:3002');
      client.on('connect', () => {
        clientSockets.push(client);
        resolve(client);
      });
    });
  };

  describe('TURN_TIMEOUT Events', () => {
    it('should emit TURN_TIMEOUT after 3 seconds for disconnected player', async () => {
      const client1 = await createClient();
      const client2 = await createClient();

      const gameId = 'test-timeout-game';
      const player1Id = 'timeout-player-1';
      const player2Id = 'timeout-player-2';

      // Join game and start it
      client1.emit(GameEvents.JOIN_GAME, {
        gameId,
        playerId: player1Id,
        playerName: 'Timeout Player 1'
      });

      client2.emit(GameEvents.JOIN_GAME, {
        gameId,
        playerId: player2Id,
        playerName: 'Timeout Player 2'
      });

      // Start the game
      client1.emit(GameEvents.START_GAME, { gameId });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Disconnect player1 (should trigger timeout)
      client1.disconnect();

      // Set up event listener for TURN_TIMEOUT
      let timeoutReceived = false;
      let timeoutData: any = null;

      client2.on(GameEvents.TURN_TIMEOUT, (data) => {
        timeoutReceived = true;
        timeoutData = data;
      });

      // Wait for the 3-second timeout (plus some buffer)
      await new Promise(resolve => setTimeout(resolve, 32000));

      expect(timeoutReceived).toBe(true);
      expect(timeoutData.playerId).toBe(player1Id);
      expect(timeoutData.timeoutCount).toBe(1);
      expect(Object.values(PlayerAction)).toContain(timeoutData.actionPerformed);
    }, 4000); // Extended timeout for turn timeout test

    it('should perform random actions for disconnected players', async () => {
      const client1 = await createClient();
      const client2 = await createClient();

      const gameId = 'test-random-action-game';
      const player1Id = 'random-action-player-1';
      const player2Id = 'random-action-player-2';

      // Join and start game
      client1.emit(GameEvents.JOIN_GAME, {
        gameId,
        playerId: player1Id,
        playerName: 'Random Action Player 1'
      });

      client2.emit(GameEvents.JOIN_GAME, {
        gameId,
        playerId: player2Id,
        playerName: 'Random Action Player 2'
      });

      client1.emit(GameEvents.START_GAME, { gameId });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Track actions performed
      const actionsPerformed: string[] = [];
      let gameStateUpdates = 0;

      client2.on(GameEvents.UPDATE_GAME_STATE, () => {
        gameStateUpdates++;
      });

      client2.on(GameEvents.TURN_TIMEOUT, (data) => {
        actionsPerformed.push(data.actionPerformed);
        // Ensure the variable is used
        expect(data).toBeDefined();
      });

      // Disconnect first player
      client1.disconnect();

      // Wait for multiple timeouts (should perform random actions each time)
      await new Promise(resolve => setTimeout(resolve, 95000)); // Wait for 3 timeouts

      expect(actionsPerformed.length).toBeGreaterThan(0);
      expect(actionsPerformed.length).toBeLessThanOrEqual(3); // Should timeout multiple times

      // All actions should be valid
      actionsPerformed.forEach(action => {
        expect(Object.values(PlayerAction)).toContain(action);
      });

      // Should have received game state updates
      expect(gameStateUpdates).toBeGreaterThan(0);
    }, 120000); // Long timeout for multiple turn timeouts

    it('should skip turns after 2 timeouts', async () => {
      const client1 = await createClient();
      const client2 = await createClient();

      const gameId = 'test-skip-turns-game';
      const player1Id = 'skip-turns-player-1';
      const player2Id = 'skip-turns-player-2';

      // Join and start game
      client1.emit(GameEvents.JOIN_GAME, {
        gameId,
        playerId: player1Id,
        playerName: 'Skip Turns Player 1'
      });

      client2.emit(GameEvents.JOIN_GAME, {
        gameId,
        playerId: player2Id,
        playerName: 'Skip Turns Player 2'
      });

      client1.emit(GameEvents.START_GAME, { gameId });

      await new Promise(resolve => setTimeout(resolve, 200));

      let turnTimeouts = 0;
      let currentTurn = '';

      client2.on(GameEvents.UPDATE_GAME_STATE, (gameState) => {
        currentTurn = gameState.playerIdTurn;
      });

      client2.on(GameEvents.TURN_TIMEOUT, (data) => {
        turnTimeouts++;
        // Ensure parameter is used
        expect(data).toBeDefined();
      });

      // Disconnect first player
      client1.disconnect();

      // Wait for 2 timeouts (60 seconds)
      await new Promise(resolve => setTimeout(resolve, 65000));

      expect(turnTimeouts).toBe(2);

      // After 2 timeouts, player1 should be skipped in turn order
      // The next turn should be player2's again (not player1)
      expect(currentTurn).toBe(player2Id);
    }, 75000); // Timeout for 2 turn timeouts
  });
});
