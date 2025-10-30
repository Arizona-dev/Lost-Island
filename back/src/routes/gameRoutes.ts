import { Router } from "express";
import {
  createGameController,
  getGameController,
  getGamesController,
  joinGameController,
  startGameController,
  updateVoteDurationController,
  resetGameController,
} from "../controllers/gameController";

const router = Router();

// Route to create a new game
router.post("/create", createGameController);

// Route to get all games
router.get("/", getGamesController);

// Route to get details of a specific game by id with password (more specific, must come first)
router.get("/:id/:password", getGameController);

// Route to get details of a specific game by id without password
router.get("/:id", getGameController);

// Route for a player to join a specific game by id
router.post("/:id/join", joinGameController);

router.post("/:id/start", startGameController);

router.patch("/:id/voteDuration", updateVoteDurationController);

router.post("/:id/reset", resetGameController);

export default router;
