import { Document } from "mongoose";

export interface IPlayer {
  user: IUser;
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

export interface IGame extends Document {
  partyName: string;
  partyOwner: IUser;
  partyCode: string;
  maxPlayers: number;
  password?: string;
  private?: boolean;
  status?: "created" | "started" | "finished";
  difficulty: "normal" | "extreme";
  gameLength: "normal" | "extended";
  players: IPlayer[];
  gameInfo?: IGameInfo;
}

export interface IUser {
  id: string;
  name: string;
}
