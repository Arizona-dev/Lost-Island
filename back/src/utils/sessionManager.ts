import { Redis } from "ioredis";
import { randomBytes } from "crypto";

const redis = new Redis();

interface SessionData {
  playerId: string;
  playerName: string;
  createdAt: number;
}

const SESSION_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Generate a cryptographically secure session token
 */
export const generateSessionToken = (): string => {
  return randomBytes(32).toString("hex");
};

/**
 * Create a new session for a player
 * @param playerId - The player's unique ID
 * @param playerName - The player's display name
 * @returns The session token
 */
export const createSession = async (
  playerId: string,
  playerName: string
): Promise<string> => {
  const token = generateSessionToken();
  
  const sessionData: SessionData = {
    playerId,
    playerName,
    createdAt: Date.now(),
  };

  // Store session in Redis with expiration
  await redis.setex(
    `session:${token}`,
    SESSION_EXPIRY,
    JSON.stringify(sessionData)
  );

  // Also create a reverse mapping: playerId -> token (for logout/cleanup)
  await redis.setex(
    `player:${playerId}:token`,
    SESSION_EXPIRY,
    token
  );

  return token;
};

/**
 * Validate a session token and return player data
 * @param token - The session token to validate
 * @returns SessionData if valid, null if invalid/expired
 */
export const validateSession = async (
  token: string
): Promise<SessionData | null> => {
  if (!token) {
    return null;
  }

  try {
    const sessionJson = await redis.get(`session:${token}`);
    
    if (!sessionJson) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(sessionJson);
    
    // Refresh expiration on each validation (sliding window)
    await redis.expire(`session:${token}`, SESSION_EXPIRY);
    await redis.expire(`player:${sessionData.playerId}:token`, SESSION_EXPIRY);

    return sessionData;
  } catch (error) {
    console.error("Error validating session:", error);
    return null;
  }
};

/**
 * Delete a session (logout)
 * @param token - The session token to delete
 */
export const deleteSession = async (token: string): Promise<void> => {
  try {
    const sessionJson = await redis.get(`session:${token}`);
    
    if (sessionJson) {
      const sessionData: SessionData = JSON.parse(sessionJson);
      
      // Delete both mappings
      await redis.del(`session:${token}`);
      await redis.del(`player:${sessionData.playerId}:token`);
    }
  } catch (error) {
    console.error("Error deleting session:", error);
  }
};

/**
 * Delete all sessions for a player
 * @param playerId - The player ID
 */
export const deletePlayerSessions = async (playerId: string): Promise<void> => {
  try {
    const token = await redis.get(`player:${playerId}:token`);
    
    if (token) {
      await redis.del(`session:${token}`);
      await redis.del(`player:${playerId}:token`);
    }
  } catch (error) {
    console.error("Error deleting player sessions:", error);
  }
};

/**
 * Refresh a session's expiration
 * @param token - The session token
 */
export const refreshSession = async (token: string): Promise<boolean> => {
  try {
    const sessionJson = await redis.get(`session:${token}`);
    
    if (!sessionJson) {
      return false;
    }

    const sessionData: SessionData = JSON.parse(sessionJson);
    
    await redis.expire(`session:${token}`, SESSION_EXPIRY);
    await redis.expire(`player:${sessionData.playerId}:token`, SESSION_EXPIRY);

    return true;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return false;
  }
};

