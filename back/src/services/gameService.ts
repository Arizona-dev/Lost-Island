import {
  getGameState,
  setGameState,
  startGame,
  createGameState,
  removePlayerFromGame,
} from "../game/Game";
import { Player } from "../game/Player";
import { Game } from "../models/gameModel";
import { IGame, IPlayer } from "../types/types";
import { getIO } from "../server";
import { GameEvents } from "../game/Events";

// Create a game
export const createGame = async (data: Partial<IGame>): Promise<IGame> => {
  const partyCode = Math.random().toString(36).substring(7).toUpperCase();
  const game = new Game(data);
  game.partyCode = partyCode;
  game.private = data.password ? true : false;
  await game.save();
  return game;
};

// Fetch a game by ID
export const getGame = async (
  id: string,
  password?: string
): Promise<Partial<IGame & { error?: string }> | null> => {
  const game = await Game.findOne({ partyCode: id });

  if (!game?.private) {
    delete game?.password;
    return game;
  }

  if (!password) {
    return {
      partyName: game.partyName,
      partyCode: game.partyCode,
      private: game.private,
      error: "Mot de passe requis",
    };
  }
  if (password && password !== game?.password) {
    return {
      partyName: game.partyName,
      partyCode: game.partyCode,
      private: game.private,
      error: "Mot de passe incorrect",
    };
  }

  delete game.password;
  return game;
};

// Join a game
export const joinGameService = async (
  id: string,
  player: Player
): Promise<void> => {
  const game = await Game.findById(id);

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "created") {
    throw new Error("Game already started");
  }

  if (game.players?.find(p => p?.user?.id === player.id)) {
    return;
  }

  if (game.players && game.players.length >= game.maxPlayers) {
    throw new Error("Game is full");
  }

  const newPlayer: IPlayer = {
    user: player,
    status: "alive",
  };

  game.players?.push(newPlayer);
  await game.save();
};

/**
 * Leave a game - handles complete player removal workflow
 * @param id - Game ID
 * @param playerId - Player ID leaving the game
 * @throws Error if game not found
 */
export const leaveGameService = async (
  id: string,
  playerId: string
): Promise<void> => {
  const game = await Game.findById(id);

  if (!game) {
    throw new Error("Game not found");
  }

  // Remove player from database
  game.players = game.players?.filter(p => p?.user?.id !== playerId);
  await game.save();

  // Remove player from Redis game state
  await removePlayerFromGame(id, playerId);

  // Check if host left
  if (game.partyOwner.id === playerId) {
    await assignNewHost(game);
  }

  // If no players remain, clean up the game
  if (!game.players || game.players.length === 0) {
    await deleteGameAndState(id, game.status === "started");
  }
};

/**
 * Assign a new host from remaining players
 * @param game - Game document from database
 * @returns Updated game with new host
 * @throws Error if no players remain
 */
const assignNewHost = async (game: IGame): Promise<IGame> => {
  if (!game.players || game.players.length === 0) {
    throw new Error("Cannot assign new host: no players remaining");
  }

  // Assign the first remaining player as host
  const newHost = game.players[0];
  game.partyOwner = { id: newHost.user.id, name: newHost.user.name };
  await game.save();

  // Emit HOST_CHANGED event
  const io = getIO();
  io.to(game.id).emit(GameEvents.HOST_CHANGED, {
    newHostId: newHost.user.id,
    newHostName: newHost.user.name
  });

  return game;
};

/**
 * Delete game from database and Redis state, emit appropriate event
 * @param id - Game ID to delete
 * @param wasStarted - Whether the game was started (affects cleanup event type)
 */
const deleteGameAndState = async (id: string, wasStarted: boolean): Promise<void> => {
  try {
    // Delete from database
    await Game.findByIdAndDelete(id);

    // Delete Redis state if it exists
    const { Redis } = require("ioredis");
    const redis = new Redis();
    await redis.del(`game:${id}`);

    // Emit appropriate event
    const io = getIO();
    const eventType = wasStarted ? GameEvents.GAME_ENDED : GameEvents.LOBBY_CLOSED;
    io.to(id).emit(eventType, { gameId: id });

    // Clean up the socket room
    io.socketsLeave(id);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Error deleting game and state: ${errorMessage}`);
  }
};

// Start a game
export const startGameService = async (id: string): Promise<IGame | null> => {
  try {
    const game = await Game.findById(id);

    if (!game || game.status !== "created") {
      throw new Error("Game already started or not found");
    }

    game.status = "started";
    await game.save();

    const gameState = await getGameState(id);
    if (!gameState) {
      throw new Error("Game state not found");
    }
    
    // Add voteDuration from database to gameState
    const updatedGameState = await startGame({
      ...gameState,
      voteDuration: game.voteDuration || 30,
    });
    
    // Emit GAME_STARTED event to all players in the game room
    const io = getIO();
    io.to(id).emit(GameEvents.GAME_STARTED, updatedGameState);
    
    return game;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(errorMessage);
  }
};

// Reset game to lobby (change status back to created)
export const resetGameToLobbyService = async (id: string): Promise<void> => {
  try {
    const game = await Game.findById(id);

    if (!game) {
      throw new Error("Game not found");
    }

    game.status = "created";
    await game.save();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(errorMessage);
  }
};

// End a game (change status to finished)
export const endGameService = async (id: string): Promise<void> => {
  try {
    const game = await Game.findById(id);

    if (!game) {
      throw new Error("Game not found");
    }

    game.status = "finished";
    await game.save();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(errorMessage);
  }
};

// Reset a finished game back to created state
export const resetGameService = async (id: string): Promise<IGame | null> => {
  try {
    const game = await Game.findById(id);

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "finished") {
      throw new Error("Cannot reset game: game is not finished");
    }

    // Reset game status to created
    game.status = "created";
    await game.save();

    // Create fresh game state in Redis with synced players
    const freshGameState = await createGameState(id);

    // Sync players from database to the fresh game state
    if (game.players && game.players.length > 0) {
      // Import the sync function from Game.ts
      const { syncPlayersFromDatabase } = await import("../game/Game");
      const syncedGameState = syncPlayersFromDatabase(freshGameState, game.players);
      await setGameState(id, syncedGameState);

      // Notify all connected players that the game has been reset
      const io = getIO();
      io.to(id).emit(GameEvents.GAME_RESET_TO_LOBBY, { gameState: syncedGameState });
    } else {
      // No players to sync, just emit with fresh state
      const io = getIO();
      io.to(id).emit(GameEvents.GAME_RESET_TO_LOBBY, { gameState: freshGameState });
    }

    return game;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(errorMessage);
  }
};

// Update voteDuration for a game
export const updateVoteDurationService = async (
  id: string,
  voteDuration: number
): Promise<IGame | null> => {
  try {
    const game = await Game.findById(id);

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "created") {
      throw new Error("Cannot update voteDuration: game already started");
    }

    if (voteDuration < 10 || voteDuration > 300) {
      throw new Error("voteDuration must be between 10 and 300 seconds");
    }

    game.voteDuration = voteDuration;
    await game.save();
    return game;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(errorMessage);
  }
};

// Fetch all games
export const getGames = async (): Promise<IGame[]> => {
  // exclude the password field and gameInfo
  const games = await Game.find({}, { password: 0, gameInfo: 0 }).exec();
  return games;
};
