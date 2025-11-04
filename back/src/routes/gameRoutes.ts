import { Router } from "express";
import {
  createGameController,
  getGameController,
  getGamesController,
  joinGameController,
  startGameController,
  updateVoteDurationController,
  updatePrivateController,
  updateDifficultyController,
  updateGameLengthController,
  updateMaxPlayersController,
  kickPlayerController,
  banPlayerController,
  resetGameController,
} from "../controllers/gameController";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

// Route to create a new game - requires authentication
router.post("/create", requireAuth, createGameController);

// Route to get all games - optional auth (can view without auth)
router.get("/", optionalAuth, getGamesController);

// Route to get details of a specific game by id with password - optional auth
router.get("/:id/:password", optionalAuth, getGameController);

// Route to get details of a specific game by id without password - optional auth
router.get("/:id", optionalAuth, getGameController);

// Route for a player to join a specific game by id - requires authentication
router.post("/:id/join", requireAuth, joinGameController);

// Route to start a game - requires authentication
router.post("/:id/start", requireAuth, startGameController);

// Route to update vote duration - requires authentication
router.patch("/:id/voteDuration", requireAuth, updateVoteDurationController);

// Route to update private status - requires authentication
router.patch("/:id/private", requireAuth, updatePrivateController);

// Route to update difficulty - requires authentication
router.patch("/:id/difficulty", requireAuth, updateDifficultyController);

// Route to update game length - requires authentication
router.patch("/:id/gameLength", requireAuth, updateGameLengthController);

// Route to update max players - requires authentication
router.patch("/:id/maxPlayers", requireAuth, updateMaxPlayersController);

// Route to kick a player - requires authentication
router.post("/:id/kick", requireAuth, kickPlayerController);

// Route to ban a player - requires authentication
router.post("/:id/ban", requireAuth, banPlayerController);

// Route to reset a game - requires authentication
router.post("/:id/reset", requireAuth, resetGameController);

export default router;
