import { Request, Response } from "express";
import {
  createGame,
  getGame,
  getGames,
  joinGameService,
  startGameService,
  updateVoteDurationService,
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
