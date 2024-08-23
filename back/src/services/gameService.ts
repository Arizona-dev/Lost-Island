import {
  GameStatus,
  getGameState,
  setGameState,
  startGame,
} from "../game/Game";
import { Player } from "../game/Player";
import { Game } from "../models/gameModel";
import { IGame, IPlayer } from "../types/types";

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

// Leave a game
export const leaveGameService = async (
  id: string,
  playerId: string
): Promise<void> => {
  const game = await Game.findById(id);

  if (!game) {
    throw new Error("Game not found");
  }

  game.players = game.players?.filter(p => p?.user?.id !== playerId);
  await game.save();
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
    await startGame(gameState);
    return game;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Fetch all games
export const getGames = async (): Promise<IGame[]> => {
  // exclude the password field and gameInfo
  const games = await Game.find({}, { password: 0, gameInfo: 0 }).exec();
  return games;
};
