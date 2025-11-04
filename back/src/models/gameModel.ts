import { Schema, model } from "mongoose";
import { IGame, IPlayer, IWeatherDay } from "../types/types";

const PlayerSchema = new Schema<IPlayer>(
  {
    user: {
      id: String,
      name: String,
    },
    status: {
      type: String,
      enum: ["alive", "poisoned", "sick", "dead", "out"],
      default: "alive",
    },
  },
  { _id: false }
);
// const PlayerSchema = new Schema<IPlayer>(
//   {
//     user: { type: Schema.Types.ObjectId, ref: "User" },
//     objects: [String],
//     status: {
//       type: String,
//       enum: ["alive", "poisoned", "sick", "dead", "out"],
//       default: "alive",
//     },
//   },
//   { _id: false }
// );

const WeatherDaySchema = new Schema<IWeatherDay>(
  {
    day: Number,
    water: { type: Number, min: 0, max: 4 },
    weather: { type: String, enum: ["sunny", "windy", "thunder", "tornado"] },
  },
  { _id: false }
);

const GameSchema = new Schema<IGame>({
  partyCode: { type: String, required: true },
  partyName: { type: String, required: true },
  partyOwner: { id: String, name: String },
  maxPlayers: { type: Number, required: true },
  players: [PlayerSchema],
  bannedPlayers: [{ id: String, name: String }],
  password: String,
  private: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["created", "started", "finished"],
    default: "created",
  },
  difficulty: { type: String, enum: ["normal", "extreme"], default: "normal" },
  gameLength: { type: String, enum: ["normal", "extended"], default: "normal" },
  voteDuration: { type: Number, default: 30, min: 10, max: 300 }, // Durée du vote en secondes (10s à 5min)
  gameInfo: {
    currentDay: Number,
    remainingWater: Number,
    remainingFood: Number,
    raftsBuild: Number,
    wood: Number,
    weatherByDays: [WeatherDaySchema],
  },
});

export const Game = model<IGame>("Game", GameSchema);
