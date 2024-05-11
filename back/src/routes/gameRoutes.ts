import { Router } from "express";
import {
  createGameController,
  getGameController,
  getGamesController,
  joinGameController,
  startGameController,
} from "../controllers/gameController";

const router = Router();

// Route to create a new game
router.post("/create", createGameController);

// Route to get all games
router.get("/", getGamesController);

// Route to get details of a specific game by id
router.get("/:id/:password?", getGameController);

// Route for a player to join a specific game by id
router.post("/:id/join", joinGameController);

router.post("/:id/start", startGameController);

export default router;
