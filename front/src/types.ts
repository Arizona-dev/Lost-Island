export interface IUser {
  id: string;
  name: string;
}

export interface IPlayer {
  user: IUser;
  objects: string[];
  status: "alive" | "poisoned" | "sick" | "dead" | "out";
}

export interface IWeatherDay {
  day: number;
  water: number;
  weather: "sunny" | "windy" | "thunder" | "tornado";
}

export interface IGameInfo {
  currentDay: number;
  remainingWater: number;
  remainingFood: number;
  raftsBuild: number;
  wood: number;
  weatherByDays: IWeatherDay[];
}

export type Game = {
  _id: string;
  partyName: string;
  partyOwner: IUser;
  partyCode: string;
  maxPlayers: number;
  difficulty: string;
  gameLength: string;
  voteDuration?: number; // Durée du vote en secondes
  private: boolean;
  status: string;
  error?: string;
  players?: IPlayer[];
  [key: string]: string | number | boolean | undefined | IUser | IPlayer[] | Game;
};
////////////////////////////////////////

export type EventLogEntry = {
  type: string;
  data: unknown;
};

export enum Effect {
  "NOTHING" = "nothing",
  "FOOD" = "food",
  "WATER" = "water",
  "WOOD" = "wood",
  "PROTECTION" = "protection",
  "VOTE_MODIFIER" = "vote_modifier",
  "STEAL_OBJECT" = "steal_object",
  "SHOOT" = "shoot",
  "HEAL" = "heal",
  "SICKNESS" = "sickness",
  "SEE_CARDS" = "see_cards",
}

export type Player = {
  id: string;
  name: string;
  voteCount: number;
  status: "normal" | "sick" | "dead";
  objects: WreckageObject[];
};

export type WreckageObject = {
  id: string;
  usage: "unique" | "permanent";
  description: string;
  effect: Effect;
  image: string;
  isHidden: boolean;
};

export type Weather = {
  id: string;
  description: string;
  water: number;
};

export type ResourceIndicator = {
  food: number;
  water: number;
  wood: number;
  raftProgress: number;
};

export type Voting = {
  playerId: string;
  targetPlayerId: string;
  votePower: number;
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
  votingReason?: "water" | "food" | "raft"; // Raison du vote: pénurie d'eau, de nourriture, ou manque de place sur le radeau
  voteStartTime?: number; // Timestamp du début du vote
  voteDuration?: number; // Durée du vote en secondes
  eventLog: EventLogEntry[];
  voting: Voting[];
  numberOfPlayersToVote?: number;
};

export enum Actions {
  SEARCH_WRECKAGE = "SEARCH_WRECKAGE",
  FISH = "FISH",
  COLLECT_WATER = "COLLECT_WATER",
  COLLECT_WOOD = "COLLECT_WOOD",
  USE_OBJECT = "USE_OBJECT",
}

export enum GameEvents {
  JOIN_GAME = "JOIN_GAME",
  LEAVE_GAME = "LEAVE_GAME",
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  GAME_STARTED = "GAME_STARTED",
  GAME_ENDED = "GAME_ENDED",
  GAME_RESET_TO_LOBBY = "GAME_RESET_TO_LOBBY",
  UPDATE_GAME_STATE = "UPDATE_GAME_STATE",
  YOUR_TURN = "YOUR_TURN",
  TURN_STARTED = "TURN_STARTED",
  TURN_ENDED = "TURN_ENDED",
  PLAYER_ACTION = "PLAYER_ACTION",
  ACTION_PROCESSED = "ACTION_PROCESSED",
  VOTE = "VOTE",
}