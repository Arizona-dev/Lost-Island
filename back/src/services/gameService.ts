import { Player } from "../game/Player";
import { Game } from "../models/gameModel";
import { IGame, IPlayer, IUser } from "../types/types";

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

  if (
    !game ||
    (game.players && game.players.length >= game.maxPlayers) ||
    game.status !== "created"
  ) {
    throw new Error("Game not found, full or already started");
  }
  const newPlayer: Partial<IPlayer> = {
    user: player,
    status: "alive",
  };

  game.players?.push(newPlayer);
  await game.save();
};

// Leave a game
export const leaveGameService = async (
  id: string,
  player: Player
): Promise<void> => {
  const game = await Game.findById(id);

  if (!game) {
    throw new Error("Game not found");
  }

  game.players = game.players?.filter(p => p?.user?.id !== player.id);
  await game.save();
};

// Start a game
export const startGame = async (id: string): Promise<IGame | null> => {
  const game = await Game.findById(id);

  if (!game || game.status !== "created") {
    throw new Error("Game already started or not found");
  }

  game.status = "started";
  await game.save();
  return game;
};

// Fetch all games
export const getGames = async (): Promise<IGame[]> => {
  // exclude the password field and gameInfo
  const games = await Game.find({}, { password: 0, gameInfo: 0 }).exec();
  return games;
};
