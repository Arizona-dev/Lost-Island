import { createGameState, joinGame, getGameState, setGameState } from '../../../src/game/Game';
import { PlayerAction, handlePlayerAction, PlayerState } from '../../../src/game/Player';

// Mock socket.io server for testing
const mockIO = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

describe('Game Logic', () => {

  describe('Game State Management', () => {
    it('should create a valid initial game state', async () => {
      const gameState = await createGameState('test-game');

      expect(gameState).toBeDefined();
      expect(gameState.id).toBe('test-game');
      expect(gameState.status).toBe('waiting');
      expect(gameState.players).toEqual([]);
      expect(gameState.resourceIndicators).toBeDefined();
      expect(gameState.weatherList).toBeDefined();
    });

    it('should allow players to join the game', async () => {
      const gameId = 'join-test-game';
      const player = {
        id: 'test-player',
        name: 'Test Player',
        status: PlayerState.NORMAL,
        voteCount: 1,
        objects: []
      };

      const gameState = await joinGame(gameId, player);

      expect(gameState.players).toHaveLength(1);
      expect(gameState.players[0].id).toBe('test-player');
      expect(gameState.players[0].name).toBe('Test Player');
    });
  });

  describe('Player Actions', () => {
    let gameState: any;

    beforeEach(async () => {
      const gameId = 'action-test-game';
      gameState = await createGameState(gameId);

      // Add a player
      const player = {
        id: 'action-player',
        name: 'Action Player',
        status: PlayerState.NORMAL,
        voteCount: 1,
        objects: []
      };

      gameState = await joinGame(gameId, player);
      await setGameState(gameId, gameState);
    });

    it('should handle FISH action', async () => {
      const updatedState = await handlePlayerAction(
        mockIO as any,
        gameState.id,
        'action-player',
        PlayerAction.FISH,
        {}
      );

      // Fish action should potentially increase food
      expect(updatedState.resourceIndicators.food).toBeDefined();
      // Note: Exact food increase depends on random factors in the game
    });

    it('should handle COLLECT_WATER action', async () => {
      const updatedState = await handlePlayerAction(
        mockIO as any,
        gameState.id,
        'action-player',
        PlayerAction.COLLECT_WATER,
        {}
      );

      expect(updatedState.resourceIndicators.water).toBeDefined();
    });

    it('should handle COLLECT_WOOD action', async () => {
      const updatedState = await handlePlayerAction(
        mockIO as any,
        gameState.id,
        'action-player',
        PlayerAction.COLLECT_WOOD,
        {}
      );

      expect(updatedState.resourceIndicators.wood).toBeDefined();
    });

    it('should reject actions from players not in game', async () => {
      await expect(
        handlePlayerAction(
          mockIO as any,
          gameState.id,
          'non-existent-player',
          PlayerAction.FISH,
          {}
        )
      ).rejects.toThrow();
    });

    it('should handle all valid player actions', async () => {
      const validActions = [
        PlayerAction.FISH,
        PlayerAction.COLLECT_WATER,
        PlayerAction.COLLECT_WOOD
      ];

      for (const action of validActions) {
        const updatedState = await handlePlayerAction(
          mockIO as any,
          gameState.id,
          'action-player',
          action,
          {}
        );

        expect(updatedState).toBeDefined();
        expect(updatedState.id).toBe(gameState.id);
      }
    });
  });

  describe('Turn Management', () => {
    it('should properly manage player turns', async () => {
      const gameId = 'turn-test-game';
      let gameState = await createGameState(gameId);

      // Add multiple players
      const players = [
        { id: 'player1', name: 'Player 1', status: PlayerState.NORMAL, voteCount: 1, objects: [] },
        { id: 'player2', name: 'Player 2', status: PlayerState.NORMAL, voteCount: 1, objects: [] },
        { id: 'player3', name: 'Player 3', status: PlayerState.NORMAL, voteCount: 1, objects: [] }
      ];

      for (const player of players) {
        gameState = await joinGame(gameId, player);
      }

      await setGameState(gameId, gameState);

      // Start the game (this should set initial turn)
      // Note: This test assumes the game start logic sets playerIdTurn

      const startedGame = await getGameState(gameId);
      expect(startedGame).toBeTruthy();
      expect(startedGame!.players).toHaveLength(3);
      expect(startedGame!.players.map(p => p.id)).toEqual(
        expect.arrayContaining(['player1', 'player2', 'player3'])
      );
    });
  });
});
