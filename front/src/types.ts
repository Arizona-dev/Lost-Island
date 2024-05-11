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

export type GameSettings = {
  _id: string;
  partyName: string;
  partyOwner: IUser;
  partyCode: string;
  maxPlayers: number;
  difficulty: string;
  gameLength: string;
  private: boolean;
  status: string;
  error?: string;
  [key: string]: string | number | boolean | undefined | IUser;
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
