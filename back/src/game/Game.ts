import { Redis } from "ioredis";
import { Player, PlayerAction, PlayerState, shufflePlayers } from "./Player";
import { getInitialResources } from "./Resources";
import { Weather, shuffleWeatherList } from "./Weather";
import { EventLogEntry, GameEvents } from "./Events";
import { getIO } from "../server";
import Redlock, { Lock } from "redlock";
import { Server } from "socket.io";

const redis = new Redis();

const redLock = new Redlock([redis], {
  driftFactor: 0.01,
  retryCount: 10,
  retryDelay: 200,
  retryJitter: 200,
});

redis.on("connect", () => console.log("[INFO]: Connected to Redis"));
redis.on("error", err =>
  console.log("[INFO]: Connection to Redis failed", err)
);

export const setGameState = async (
  gameId: string,
  gameState: GameState
): Promise<void> => {
  const lockKey = `lock:game:${gameId}`;
  let lock: Lock | null = null;

  try {
    lock = await redLock.acquire([lockKey], 1000);

    await redis.set(`game:${gameId}`, JSON.stringify(gameState));

    const io: Server = getIO();

    io.to(gameId).emit(GameEvents.UPDATE_GAME_STATE, gameState);
  } catch (error: any) {
    console.error(`Error setting key ${gameId} in Redis: ${error.message}`);
  } finally {
    if (lock) {
      try {
        await lock.release();
      } catch (releaseError) {
        console.error(`Error releasing lock for game ${gameId}:`, releaseError);
      }
    }
  }
};

export const getGameState = async (
  gameId: string
): Promise<GameState | null> => {
  try {
    const gameState = await redis.get(`game:${gameId}`);
    return gameState ? JSON.parse(gameState) : null;
  } catch (error: any) {
    console.error(`Error getting key ${gameId} from Redis: ${error.message}`);
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
      day: 1,
      voting: [],
      numberOfPlayersToVote: 0,
    };

    await setGameState(state.id, newState);

    return newState;
  } catch (error: any) {
    console.error(`Error starting game ${state.id}: ${error.message}`);
    throw new Error("Error starting game");
  }
};

export const endGame = async (state: GameState): Promise<void> => {
  const newState = {
    ...state,
    status: GameStatus.ENDED,
  };
  await setGameState(state.id, newState);
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

    const newState = {
      ...gameState,
      players: [...gameState.players, player],
    };

    await setGameState(gameId, newState);

    return newState;
  } catch (error: any) {
    console.error(`Error joining game ${gameId}: ${error.message}`);
    throw new Error("Error joining game");
  }
};

export const isPlayerInGame = (gameState: GameState, playerId: string) => {
  return gameState.players.some(player => player.id === playerId);
};

export const getNextPlayerTurn = (gameState: GameState): string => {
  const players = gameState.players;
  const currentPlayerIndex = players.findIndex(
    player => player.id === gameState.playerIdTurn
  );
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  return players[nextPlayerIndex].id;
};

// Move the first player to the end of the list
export const switchFirstPlayer = (gameState: GameState) => {
  const players = [...gameState.players];

  const firstPlayer = players.shift();

  if (firstPlayer) {
    players.push(firstPlayer);
  }

  return {
    ...gameState,
    players,
    playerIdTurn: players[0].id,
  };
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

  console.log(
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
  const needsVoting = newWater < alivePlayerCount || newFood < alivePlayerCount;

  // Create a new state with updated resources
  const newState: GameState = {
    ...gameState,
    resourceIndicators: {
      ...gameState.resourceIndicators,
      water: newWater,
      food: newFood,
    },
  };

  return { newState, needsVoting };
};
