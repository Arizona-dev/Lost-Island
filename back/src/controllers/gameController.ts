import { Request, Response } from "express";
import {
  createGame,
  getGame,
  getGames,
  joinGameService,
  startGame,
} from "../services/gameService";

export const createGameController = async (req: Request, res: Response) => {
  try {
    const game = await createGame(req.body);
    res.status(201).json(game);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const getGameController = async (req: Request, res: Response) => {
  try {
    const game = await getGame(req.params.id, req.params.password);
    if (!game) {
      return res.status(404).send("Game not found");
    }
    res.json(game);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const getGamesController = async (req: Request, res: Response) => {
  try {
    const games = await getGames();
    res.json(games);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const joinGameController = async (req: Request, res: Response) => {
  try {
    await joinGameService(req.params.id, req.body.player);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const startGameController = async (req: Request, res: Response) => {
  try {
    const game = await startGame(req.params.id);
    if (!game) {
      return res.status(404).send("Game not found or unable to start");
    }
    res.json(game);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};
