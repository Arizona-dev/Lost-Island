import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { createSession, deleteSession } from "../utils/sessionManager";
import logger from "../utils/logger";

/**
 * Login/Register a new ephemeral player
 * Creates a player ID and session token
 */
export const loginController = async (req: Request, res: Response) => {
  try {
    const { playerName } = req.body;

    if (!playerName || typeof playerName !== "string" || playerName.trim().length === 0) {
      res.status(400).json({ error: "Player name is required" });
      return;
    }

    // Validate player name length
    if (playerName.trim().length > 50) {
      res.status(400).json({ error: "Player name must be less than 50 characters" });
      return;
    }

    // Generate a unique player ID
    const playerId = uuidv4();

    // Create a session token
    const sessionToken = await createSession(playerId, playerName.trim());

    logger.info(`[AUTH]: Player logged in: ${playerName} (${playerId})`);

    res.status(200).json({
      playerId,
      playerName: playerName.trim(),
      sessionToken,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[AUTH]: Error during login", errorMessage);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Logout - invalidate session token
 */
export const logoutController = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      await deleteSession(token);
      logger.info("[AUTH]: Session logged out");
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[AUTH]: Error during logout", errorMessage);
    res.status(500).json({ error: "Logout failed" });
  }
};

/**
 * Validate current session
 */
export const validateSessionController = async (req: Request, res: Response) => {
  // If we reach here, the requireAuth middleware has already validated the session
  res.status(200).json({
    valid: true,
    playerId: req.session?.playerId,
    playerName: req.session?.playerName,
  });
};

