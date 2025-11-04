import { Request, Response } from "express";
import {
  createGame,
  getGame,
  getGames,
  joinGameService,
  startGameService,
  updateVoteDurationService,
  updatePrivateService,
  updateDifficultyService,
  updateGameLengthService,
  updateMaxPlayersService,
  kickPlayerService,
  banPlayerService,
  resetGameService,
} from "../services/gameService";
import logger from "../utils/logger";

export const createGameController = async (req: Request, res: Response) => {
  try {
    const game = await createGame(req.body);
    res.status(201).json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error creating game", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const getGameController = async (req: Request, res: Response) => {
  try {
    // Use authenticated playerId from session if available, otherwise fall back to query param
    const playerId = req.session?.playerId || (req.query.playerId as string);
    const game = await getGame(req.params.id, req.params.password, playerId);
    if (!game) {
      res.status(404).send("Game not found");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error getting game", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const getGamesController = async (_req: Request, res: Response) => {
  try {
    const games = await getGames();
    res.json(games);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error getting games", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const joinGameController = async (req: Request, res: Response) => {
  try {
    // Use authenticated player from session (requireAuth middleware ensures this exists)
    const player = {
      id: req.session!.playerId,
      name: req.session!.playerName,
    };
    await joinGameService(req.params.id, player);
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error joining game", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const startGameController = async (req: Request, res: Response) => {
  try {
    const game = await startGameService(req.params.id);
    if (!game) {
      res.status(404).send("Game not found or unable to start");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error starting game", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const updateVoteDurationController = async (req: Request, res: Response) => {
  try {
    const game = await updateVoteDurationService(req.params.id, req.body.voteDuration);
    if (!game) {
      res.status(404).send("Game not found");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error updating voteDuration", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const resetGameController = async (req: Request, res: Response) => {
  try {
    const game = await resetGameService(req.params.id);
    if (!game) {
      res.status(404).send("Game not found or unable to reset");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error resetting game", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const updatePrivateController = async (req: Request, res: Response) => {
  try {
    const game = await updatePrivateService(req.params.id, req.body.private, req.body.password);
    if (!game) {
      res.status(404).send("Game not found");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error updating private", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const updateDifficultyController = async (req: Request, res: Response) => {
  try {
    const game = await updateDifficultyService(req.params.id, req.body.difficulty);
    if (!game) {
      res.status(404).send("Game not found");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error updating difficulty", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const updateGameLengthController = async (req: Request, res: Response) => {
  try {
    const game = await updateGameLengthService(req.params.id, req.body.gameLength);
    if (!game) {
      res.status(404).send("Game not found");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error updating gameLength", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const updateMaxPlayersController = async (req: Request, res: Response) => {
  try {
    const game = await updateMaxPlayersService(req.params.id, req.body.maxPlayers);
    if (!game) {
      res.status(404).send("Game not found");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error updating maxPlayers", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const kickPlayerController = async (req: Request, res: Response) => {
  try {
    const game = await kickPlayerService(req.params.id, req.body.playerId);
    if (!game) {
      res.status(404).send("Game not found");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error kicking player", errorMessage);
    res.status(500).send(errorMessage);
  }
};

export const banPlayerController = async (req: Request, res: Response) => {
  try {
    const game = await banPlayerService(req.params.id, req.body.playerId, req.body.playerName);
    if (!game) {
      res.status(404).send("Game not found");
      return;
    }
    res.json(game);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[CONTROLLER]: Error banning player", errorMessage);
    res.status(500).send(errorMessage);
  }
};
