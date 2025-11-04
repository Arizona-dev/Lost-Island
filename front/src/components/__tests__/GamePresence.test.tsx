import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Game from '../Game';
import socket from '../../socket';
import { GameEvents } from '../../types';

// Mock socket with more detailed tracking
const mockSocket = socket as jest.Mocked<typeof socket>;
const socketEventHandlers = new Map<string, Function>();

jest.mock('../../socket', () => ({
  default: {
    on: jest.fn((event, handler) => {
      socketEventHandlers.set(event, handler);
    }),
    off: jest.fn((event) => {
      socketEventHandlers.delete(event);
    }),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/game/test-presence-game' }),
}));

describe('Game Presence Indicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    socketEventHandlers.clear();
  });

  const renderGame = () => {
    return render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );
  };

  const triggerSocketEvent = (event: string, data: any) => {
    const handler = socketEventHandlers.get(event);
    if (handler) {
      handler(data);
    }
  };

  describe('Player Status Indicators', () => {
    it('should display green dot for online players', async () => {
      renderGame();

      // Simulate game state with online players
      const mockGameState = {
        players: [
          { id: 'player1', name: 'Player 1', isOnline: true, status: 'normal' },
          { id: 'player2', name: 'Player 2', isOnline: true, status: 'normal' },
        ],
        status: 'started'
      };

      triggerSocketEvent(GameEvents.UPDATE_GAME_STATE, mockGameState);

      await waitFor(() => {
        // Check for green status indicators (online players)
        const greenDots = document.querySelectorAll('.bg-green-500, .text-green-500');
        expect(greenDots.length).toBeGreaterThan(0);
      });
    });

    it('should display orange dot and timer for disconnected players', async () => {
      renderGame();

      // First set online players
      const initialState = {
        players: [
          { id: 'player1', name: 'Player 1', isOnline: true, status: 'normal' },
        ],
        status: 'started'
      };

      triggerSocketEvent(GameEvents.UPDATE_GAME_STATE, initialState);

      // Then simulate player going offline
      const offlineTimestamp = Date.now();
      triggerSocketEvent(GameEvents.PLAYER_OFFLINE, {
        playerId: 'player1',
        offlineTimestamp
      });

      await waitFor(() => {
        // Should show orange indicator and countdown timer
        const orangeElements = document.querySelectorAll('.bg-orange-600, .text-orange-600');
        expect(orangeElements.length).toBeGreaterThan(0);

        // Should show countdown (30s, 29s, etc.)
        const timerText = screen.getByText(/\d+s/);
        expect(timerText).toBeInTheDocument();
      });
    });

    it('should display grey dot for players who left', async () => {
      renderGame();

      // Simulate player leaving after grace period
      const mockGameState = {
        players: [
          { id: 'player1', name: 'Player 1', isOnline: false, hasLeftGame: true, status: 'normal' },
        ],
        status: 'started'
      };

      triggerSocketEvent(GameEvents.UPDATE_GAME_STATE, mockGameState);

      await waitFor(() => {
        // Should show grey indicator and "LEFT" text
        const greyElements = document.querySelectorAll('.bg-gray-600, .text-gray-600');
        expect(greyElements.length).toBeGreaterThan(0);

        const leftText = screen.getByText('LEFT');
        expect(leftText).toBeInTheDocument();
      });
    });

    it('should display crown for game host', async () => {
      renderGame();

      const mockGameState = {
        players: [
          { id: 'host-player', name: 'Host Player', isOnline: true, status: 'normal' },
          { id: 'regular-player', name: 'Regular Player', isOnline: true, status: 'normal' },
        ],
        partyOwner: { id: 'host-player', name: 'Host Player' },
        status: 'started'
      };

      triggerSocketEvent(GameEvents.UPDATE_GAME_STATE, mockGameState);

      await waitFor(() => {
        // Should show crown emoji 👑 for host
        const crownIcon = screen.getByText('👑');
        expect(crownIcon).toBeInTheDocument();
      });
    });
  });

  describe('Event State Preservation', () => {
    it('should preserve presence data across UPDATE_GAME_STATE', async () => {
      renderGame();

      // Set initial presence state
      triggerSocketEvent(GameEvents.PLAYER_OFFLINE, {
        playerId: 'player1',
        offlineTimestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate game state update
      const updatedGameState = {
        players: [
          { id: 'player1', name: 'Player 1', status: 'normal' }, // No presence data
        ],
        status: 'started'
      };

      triggerSocketEvent(GameEvents.UPDATE_GAME_STATE, updatedGameState);

      // Presence data should be preserved (isOnline: false, offlineTimestamp, etc.)
      await waitFor(() => {
        const timerText = screen.getByText(/\d+s/);
        expect(timerText).toBeInTheDocument();
      });
    });

    it('should preserve presence data across GAME_STARTED', async () => {
      renderGame();

      // Set presence state before game starts
      triggerSocketEvent(GameEvents.PLAYER_OFFLINE, {
        playerId: 'player1',
        offlineTimestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate game starting
      const startedGameState = {
        players: [
          { id: 'player1', name: 'Player 1', status: 'normal' }, // No presence data
        ],
        status: 'started'
      };

      triggerSocketEvent(GameEvents.GAME_STARTED, startedGameState);

      // Presence data should be preserved
      await waitFor(() => {
        const timerText = screen.getByText(/\d+s/);
        expect(timerText).toBeInTheDocument();
      });
    });
  });

  describe('Turn Timeout Display', () => {
    it('should handle TURN_TIMEOUT events and display action info', async () => {
      renderGame();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      triggerSocketEvent(GameEvents.TURN_TIMEOUT, {
        playerId: 'player1',
        timeoutCount: 1,
        actionPerformed: 'FISH'
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('TURN_TIMEOUT')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('FISH')
        );
      });

      consoleSpy.mockRestore();
    });

    it('should warn about turn skipping after 2 timeouts', async () => {
      renderGame();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      triggerSocketEvent(GameEvents.TURN_TIMEOUT, {
        playerId: 'player1',
        timeoutCount: 2,
        actionPerformed: 'COLLECT_WATER'
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('timed out twice')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('turns will be skipped')
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
