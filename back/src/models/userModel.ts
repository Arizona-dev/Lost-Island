import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  games: Schema.Types.ObjectId[];
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
});

export const User = mongoose.model<IUser>("User", userSchema);
