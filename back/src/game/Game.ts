import { Redis } from "ioredis";
import { Player, PlayerAction, PlayerState, shufflePlayers } from "./Player";
import { getInitialResources } from "./Resources";
import { Weather, shuffleWeatherList } from "./Weather";
import { EventLogEntry, GameEvents } from "./Events";
import { getIO } from "../server";
import { Server } from "socket.io";
import logger from "../utils/logger";

const redis = new Redis();

redis.on("connect", () => logger.info("Connected to Redis"));
redis.on("error", err =>
  logger.error("Connection to Redis failed", err)
);

// Simple Redis-based lock using SET NX (set if not exists)
const acquireLock = async (key: string, ttl: number = 1000): Promise<boolean> => {
  const result = await redis.set(key, "locked", "PX", ttl, "NX");
  return result === "OK";
};

const releaseLock = async (key: string): Promise<void> => {
  await redis.del(key);
};

// Deduplicate players array (keep first occurrence of each player ID)
export const deduplicatePlayers = (gameState: GameState): GameState => {
  const seenIds = new Set<string>();
  const uniquePlayers: Player[] = [];

  gameState.players.forEach((player) => {
    if (player.id && !seenIds.has(player.id)) {
      seenIds.add(player.id);
      // Ensure name is always present
      uniquePlayers.push({
        ...player,
        name: player.name || "Unknown Player",
      });
    }
  });

  return {
    ...gameState,
    players: uniquePlayers,
  };
};

export const setGameState = async (
  gameId: string,
  gameState: GameState
): Promise<void> => {
  const lockKey = `lock:game:${gameId}`;
  const lockAcquired = await acquireLock(lockKey, 1000);

  if (!lockAcquired) {
    logger.warn(`Could not acquire lock for game ${gameId}, retrying...`);
    // Retry once after a short delay
    await new Promise(resolve => setTimeout(resolve, 50));
    const retryLock = await acquireLock(lockKey, 1000);
    if (!retryLock) {
      logger.error(`Failed to acquire lock for game ${gameId} after retry`);
      throw new Error(`Could not acquire lock for game ${gameId}`);
    }
  }

  try {
    // Deduplicate players before saving
    const deduplicatedState = deduplicatePlayers(gameState);
    
    await redis.set(`game:${gameId}`, JSON.stringify(deduplicatedState));

    const io: Server = getIO();
    io.to(gameId).emit(GameEvents.UPDATE_GAME_STATE, deduplicatedState);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error setting key ${gameId} in Redis: ${errorMessage}`);
    throw error;
  } finally {
    await releaseLock(lockKey);
  }
};

export const getGameState = async (
  gameId: string
): Promise<GameState | null> => {
  try {
    const gameState = await redis.get(`game:${gameId}`);
    return gameState ? JSON.parse(gameState) : null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error getting key ${gameId} from Redis: ${errorMessage}`);
    return null;
  }
};

export type ResourceIndicator = {
  food: number;
  water: number;
  wood: number;
  raftProgress: number;
};

export enum GameStatus {
  CREATED = "created",
  STARTED = "started",
  ENDED = "ended",
}

export type Voting = {
  playerId: string;
  targetPlayerId: string;
  votePower: number;
};

export type GameState = {
  id: string;
  day: number;
  status: GameStatus;
  players: Player[];
  playerIdTurn: string;
  weatherList: Weather[];
  resourceIndicators: ResourceIndicator;
  isHurricaneActive: boolean;
  isVotingActive: boolean;
  votingReason?: "water" | "food" | "raft"; // Raison du vote: pénurie d'eau, de nourriture, ou manque de place sur le radeau
  voteStartTime?: number; // Timestamp du début du vote
  voteDuration?: number; // Durée du vote en secondes
  eventLog: EventLogEntry[];
  voting: Voting[];
  numberOfPlayersToVote: number;
};

export type GameAction =
  | { type: "START_GAME" }
  | { type: "START_TURN"; playerId: string }
  | { type: "END_TURN"; playerId: string }
  | { type: "PLAYER_ACTION"; playerId: string; action: PlayerAction }
  | { type: "VOTE"; playerId: string; targetPlayerId: string };

export const createGameState = async (id: string): Promise<GameState> => {
  const game: GameState = {
    id,
    day: 1,
    status: GameStatus.CREATED,
    players: [],
    playerIdTurn: "",
    weatherList: [],
    resourceIndicators: getInitialResources(0),
    isHurricaneActive: false,
    isVotingActive: false,
    votingReason: undefined,
    eventLog: [],
    voting: [],
    numberOfPlayersToVote: 0,
  };
  await setGameState(id, game);
  return game;
};

export const startGame = async (state: GameState): Promise<GameState> => {
  try {
    // Shuffle players and initialize the game state
    const players = shufflePlayers(state.players);
    const newState = {
      ...state,
      status: GameStatus.STARTED,
      weatherList: shuffleWeatherList(),
      players: players.map(player => ({
        ...player,
        status: PlayerState.NORMAL,
        objects: [],
      })),
      playerIdTurn: players[0].id,
      resourceIndicators: getInitialResources(state.players.length),
      eventLog: [],
      isHurricaneActive: false,
      isVotingActive: false,
      votingReason: undefined,
      day: 1,
      voting: [],
      numberOfPlayersToVote: 0,
    };

    await setGameState(state.id, newState);

    return newState;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error starting game ${state.id}: ${errorMessage}`);
    throw new Error("Error starting game");
  }
};

export const endGame = async (state: GameState): Promise<void> => {
  const newState = {
    ...state,
    status: GameStatus.ENDED,
  };
  await setGameState(state.id, newState);
  
  // Update database status to "finished"
  const { endGameService } = await import("../services/gameService");
  await endGameService(state.id).catch(err => {
    logger.error(`Error updating game status in database: ${err}`);
  });
  
  // Emit GAME_ENDED event to all players
  const io = getIO();
  io.to(state.id).emit(GameEvents.GAME_ENDED, newState);
};

export const resetGameToLobby = async (state: GameState): Promise<GameState> => {
  try {
    const newState: GameState = {
      ...state,
      status: GameStatus.CREATED,
      day: 1,
      playerIdTurn: "",
      weatherList: [],
      resourceIndicators: getInitialResources(0),
      isHurricaneActive: false,
      isVotingActive: false,
      votingReason: undefined,
      eventLog: [],
      voting: [],
      numberOfPlayersToVote: 0,
      // Keep players but reset their status and objects
      players: state.players.map(player => ({
        ...player,
        status: PlayerState.NORMAL,
        objects: [],
      })),
    };

    await setGameState(state.id, newState);
    return newState;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error resetting game ${state.id} to lobby: ${errorMessage}`);
    throw new Error("Error resetting game to lobby");
  }
};

export const joinGame = async (
  gameId: string,
  player: Player
): Promise<GameState> => {
  try {
    const gameState = await getGameState(gameId);

    if (!gameState) {
      throw new Error("Game not found");
    }

    // Check if player is already in the game to prevent duplicates
    if (isPlayerInGame(gameState, player.id)) {
      logger.debug(`Player ${player.id} is already in game ${gameId}`);
      return gameState;
    }

    const newState = {
      ...gameState,
      players: [...gameState.players, player],
    };

    await setGameState(gameId, newState);

    return newState;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error joining game ${gameId}: ${errorMessage}`);
    throw new Error("Error joining game");
  }
};

export const isPlayerInGame = (gameState: GameState, playerId: string) => {
  return gameState.players.some(player => player.id === playerId);
};

// Sync players from database to gameState and deduplicate
export const syncPlayersFromDatabase = (
  gameState: GameState,
  databasePlayers: Array<{ user: { id: string; name: string } }>
): GameState => {
  // Convert database players to gameState players format
  const dbPlayersMap = new Map<string, Player>();
  
  databasePlayers.forEach((dbPlayer) => {
    if (dbPlayer?.user?.id && dbPlayer?.user?.name) {
      dbPlayersMap.set(dbPlayer.user.id, {
        id: dbPlayer.user.id,
        name: dbPlayer.user.name,
        voteCount: 1,
        status: PlayerState.NORMAL,
        objects: [],
      });
    }
  });

  // Merge existing gameState players with database players
  // Database players take precedence for names (in case name was updated)
  const existingPlayersMap = new Map<string, Player>();
  gameState.players.forEach((player) => {
    if (player.id) {
      existingPlayersMap.set(player.id, player);
    }
  });

  // Merge: keep existing player data but update names from database
  const mergedPlayers: Player[] = [];
  const seenIds = new Set<string>();

  // First, add all existing players (preserving their game state)
  existingPlayersMap.forEach((player, id) => {
    if (!seenIds.has(id)) {
      // Update name from database if available
      const dbPlayer = dbPlayersMap.get(id);
      mergedPlayers.push({
        ...player,
        name: dbPlayer?.name || player.name || "Unknown Player",
      });
      seenIds.add(id);
    }
  });

  // Then, add any players from database that weren't in gameState
  dbPlayersMap.forEach((dbPlayer, id) => {
    if (!seenIds.has(id)) {
      mergedPlayers.push(dbPlayer);
      seenIds.add(id);
    }
  });

  return {
    ...gameState,
    players: mergedPlayers,
  };
};

export const getNextPlayerTurn = (gameState: GameState): string => {
  const players = gameState.players;
  const currentPlayerIndex = players.findIndex(
    player => player.id === gameState.playerIdTurn
  );
  
  // Find the next alive player in the original order
  let attempts = 0;
  let nextIndex = (currentPlayerIndex + 1) % players.length;
  
  while (attempts < players.length) {
    const nextPlayer = players[nextIndex];
    if (nextPlayer.status !== PlayerState.DEAD) {
      return nextPlayer.id;
    }
    nextIndex = (nextIndex + 1) % players.length;
    attempts++;
  }
  
  // If no alive player found (shouldn't happen), return current player
  logger.warn("No alive player found in getNextPlayerTurn");
  return gameState.playerIdTurn;
};

// After each day completes, the next player in the original order starts the next day
// This preserves the original order: if order is Z, T, M, it stays Z, T, M every day
// But the starting player rotates: Day 1 starts with Z, Day 2 starts with T, Day 3 starts with M, etc.
export const switchFirstPlayer = (gameState: GameState) => {
  const players = gameState.players;
  
  // Find the current player who just finished their turn (the last player in the cycle)
  const currentPlayerIndex = players.findIndex(
    player => player.id === gameState.playerIdTurn
  );
  
  logger.debug(`switchFirstPlayer: Current player (last in cycle) is ${gameState.playerIdTurn} at index ${currentPlayerIndex}`);
  logger.debug(`switchFirstPlayer: Player order is ${players.map(p => `${p.id}(${p.status})`).join(", ")}`);
  
  // Find the next alive player after the current player in the original order
  // This will be the new first player for the next day
  // Example: If order is Z, T, M and M just finished, next should be Z
  let nextIndex = (currentPlayerIndex + 1) % players.length;
  let attempts = 0;
  
  while (attempts < players.length) {
    const nextPlayer = players[nextIndex];
    if (nextPlayer.status !== PlayerState.DEAD) {
      // Found the next alive player, they will start the next day
      // Don't rotate the list, keep the original order in the array
      logger.debug(`switchFirstPlayer: Next player to start next day is ${nextPlayer.id} at index ${nextIndex}`);
      return {
        ...gameState,
        playerIdTurn: nextPlayer.id,
      };
    }
    nextIndex = (nextIndex + 1) % players.length;
    attempts++;
  }
  
  // If no alive player found (shouldn't happen), return state unchanged
  logger.warn("No alive player found in switchFirstPlayer");
  return gameState;
};

export const setNextDay = (gameState: GameState) => {
  const currentDay = gameState.day;
  const nextDay = currentDay + 1;

  // Ensure the weather list is not exhausted
  if (currentDay >= gameState.weatherList.length) {
    throw new Error("Weather list exhausted. Cannot proceed to the next day.");
  }

  const weather = gameState.weatherList[currentDay];

  // Determine if the weather is a hurricane
  const isHurricaneActive = weather.description === "Hurricane";

  logger.info(
    `Transitioning to day ${nextDay}. Hurricane: ${isHurricaneActive}`
  );

  // Return a new game state object with updated day and hurricane status
  const newState: GameState = {
    ...gameState,
    day: nextDay,
    isHurricaneActive,
  };

  return newState;
};

// Decrement water and food from the resource indicators for each player alive
export const decrementResource = (gameState: GameState) => {
  // Filter out dead players
  const alivePlayers = gameState.players.filter(
    player => player.status !== PlayerState.DEAD
  );
  const alivePlayerCount = alivePlayers.length;

  // If only one player alive and resources are insufficient, kill them and end game
  if (alivePlayerCount === 1) {
    const needsWaterVoting = gameState.resourceIndicators.water < 1;
    const needsFoodVoting = gameState.resourceIndicators.food < 1;
    
    if (needsWaterVoting || needsFoodVoting) {
      const lastPlayer = alivePlayers[0];
      logger.info(`Last player ${lastPlayer.id} dies due to insufficient resources. Game over.`);
      
      // Kill the last player
      const updatedPlayers = gameState.players.map(player => {
        if (player.id === lastPlayer.id) {
          return { ...player, status: PlayerState.DEAD };
        }
        return player;
      });

      // End the game
      return {
        newState: {
          ...gameState,
          players: updatedPlayers,
          status: GameStatus.ENDED,
          resourceIndicators: {
            ...gameState.resourceIndicators,
            water: Math.max(0, gameState.resourceIndicators.water - 1),
            food: Math.max(0, gameState.resourceIndicators.food - 1),
          },
        },
        needsVoting: false,
        gameEnded: true,
      };
    }
  }

  // Calculate new resource values ensuring they don't go below zero
  const newWater = Math.max(
    0,
    gameState.resourceIndicators.water - alivePlayerCount
  );
  const newFood = Math.max(
    0,
    gameState.resourceIndicators.food - alivePlayerCount
  );

  // Determine if a vote is needed due to insufficient resources
  // According to rules: first check water, then food
  const needsWaterVoting = gameState.resourceIndicators.water < alivePlayerCount;
  const needsFoodVoting = gameState.resourceIndicators.food < alivePlayerCount;
  const needsVoting = needsWaterVoting || needsFoodVoting;

  // Determine the voting reason (water takes priority)
  let votingReason: "water" | "food" | "raft" | undefined = undefined;
  if (needsWaterVoting) {
    votingReason = "water";
  } else if (needsFoodVoting) {
    votingReason = "food";
  }

  // Create a new state with updated resources
  const newState: GameState = {
    ...gameState,
    resourceIndicators: {
      ...gameState.resourceIndicators,
      water: newWater,
      food: newFood,
    },
    votingReason,
  };

  return { newState, needsVoting, gameEnded: false };
};
