import { Redis } from "ioredis";
import { Player, PlayerAction, shufflePlayers } from "./Player";
import { getInitialResources } from "./Resources";
import { Weather, shuffleWeatherList } from "./Weather";
import { EventLogEntry } from "./Events";

const redis = new Redis();

redis.on("connect", () => console.log("[INFO]: Connected to Redis"));
redis.on("error", err => console.log("[INFO]: Redis error", err));

export const setGameState = async (gameId: string, gameState: GameState) => {
  try {
    await redis.set(`game:${gameId}`, JSON.stringify(gameState));
  } catch (error: any) {
    console.error(`Error setting key ${gameId} in Redis: ${error.message}`);
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
  };
  await setGameState(id, game);
  return game;
};

export const startGame = async (state: GameState): Promise<GameState> => {
  console.log("Starting game", state.id, state.players);
  const players = shufflePlayers(state.players);
  const newState = {
    ...state,
    status: GameStatus.STARTED,
    weatherList: shuffleWeatherList(),
    players,
    playerIdTurn: players ? players[0].id : "",
    resourceIndicators: getInitialResources(state.players.length),
  };
  await setGameState(state.id, newState);
  return newState;
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
): Promise<GameState | null> => {
  const gameState = await getGameState(gameId);
  if (!gameState) {
    return null;
  }

  const newState = {
    ...gameState,
    players: [...gameState.players, player],
  };
  await setGameState(gameId, newState);
  return newState;
};

export const isPlayerInGame = (gameState: GameState, playerId: string) => {
  return gameState.players.some(player => player.id === playerId);
};
