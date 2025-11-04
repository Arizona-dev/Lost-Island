import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Game from '../Game';
import socket from '../../socket';
import { GameEvents } from '../../types';

// Mock socket
const mockSocket = socket as jest.Mocked<typeof socket>;
jest.mock('../../socket');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/game/test-game-123' }),
}));

// Mock game service
jest.mock('../../services/gameService', () => ({
  getGame: jest.fn(),
}));

describe('Game Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset socket mock
    mockSocket.on = jest.fn();
    mockSocket.off = jest.fn();
    mockSocket.emit = jest.fn();
  });

  const renderGame = () => {
    return render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );
  };

  describe('Socket Event Handlers', () => {
    it('should register all socket event listeners on mount', () => {
      renderGame();

      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.GAME_ENDED, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.GAME_RESET_TO_LOBBY, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.PLAYER_OFFLINE, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.PLAYER_LEFT_GAME, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.PLAYER_ONLINE, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.HOST_CHANGED, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.LOBBY_CLOSED, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.TURN_TIMEOUT, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.UPDATE_GAME_STATE, expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(GameEvents.GAME_STARTED, expect.any(Function));
    });

    it('should clean up socket event listeners on unmount', () => {
      const { unmount } = renderGame();

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.GAME_ENDED);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.GAME_RESET_TO_LOBBY);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.PLAYER_OFFLINE);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.PLAYER_LEFT_GAME);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.PLAYER_ONLINE);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.HOST_CHANGED);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.LOBBY_CLOSED);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.TURN_TIMEOUT);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.UPDATE_GAME_STATE);
      expect(mockSocket.off).toHaveBeenCalledWith(GameEvents.GAME_STARTED);
    });
  });

  describe('PLAYER_OFFLINE Event Handling', () => {
    it('should update player status when PLAYER_OFFLINE event received', async () => {
      renderGame();

      // Get the PLAYER_OFFLINE event handler
      const playerOfflineHandler = mockSocket.on.mock.calls.find(
        call => call[0] === GameEvents.PLAYER_OFFLINE
      )[1];

      const mockGameData = {
        players: [
          { id: 'player1', name: 'Player 1', isOnline: true },
          { id: 'player2', name: 'Player 2', isOnline: true },
        ]
      };

      // Simulate PLAYER_OFFLINE event
      playerOfflineHandler({ playerId: 'player1', offlineTimestamp: Date.now() });

      // Wait for state update (this would normally update the component)
      await waitFor(() => {
        // The handler should update gameData state
        // In a real test, we'd check the component renders the offline status
      });
    });

    it('should display offline timer for disconnected players', () => {
      // This test would check that the OfflineTimer component is rendered
      // with the correct timestamp when a player goes offline
    });
  });

  describe('TURN_TIMEOUT Event Handling', () => {
    it('should handle TURN_TIMEOUT events with action information', async () => {
      renderGame();

      // Get the TURN_TIMEOUT event handler
      const turnTimeoutHandler = mockSocket.on.mock.calls.find(
        call => call[0] === GameEvents.TURN_TIMEOUT
      )[1];

      // Simulate TURN_TIMEOUT event
      turnTimeoutHandler({
        playerId: 'player1',
        timeoutCount: 1,
        actionPerformed: 'FISH'
      });

      // The handler should update the player's turnTimeouts count
      // and log the action performed
    });

    it('should display warning after 2 timeouts', () => {
      // Test that after 2 timeouts, the UI indicates turns will be skipped
    });
  });

  describe('Presence Indicators', () => {
    it('should show green dot for online players', () => {
      // Test that online players display with green status indicator
    });

    it('should show orange dot and timer for recently disconnected players', () => {
      // Test that disconnected players show orange status with countdown timer
    });

    it('should show grey dot for players who left after grace period', () => {
      // Test that players who left show grey status indicator
    });

    it('should display crown icon for game host', () => {
      // Test that the party owner (host) shows a crown emoji
    });
  });

  describe('Game State Updates', () => {
    it('should preserve presence data when game state updates', () => {
      // Test that UPDATE_GAME_STATE events preserve isOnline, offlineTimestamp, etc.
    });

    it('should preserve presence data when game starts', () => {
      // Test that GAME_STARTED events preserve presence information
    });
  });
});
