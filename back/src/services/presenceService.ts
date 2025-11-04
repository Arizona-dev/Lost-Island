import { Redis } from "ioredis";
import logger from "../utils/logger";

/**
 * Presence Service
 *
 * Manages player online/offline status with Redis-backed persistence and grace periods.
 * Handles transient disconnects by giving players a 60-second window to reconnect
 * before being removed from games.
 */

const redis = new Redis();

redis.on("connect", () => logger.info("Presence service connected to Redis"));
redis.on("error", err => logger.error("Presence service Redis connection failed", err));

// Timer storage for grace periods
const timers = new Map<string, NodeJS.Timeout>();

type PresenceStatus = "online" | "offline";

interface PresenceData {
  status: PresenceStatus;
  lastSeen: number;
}

/**
 * Generate Redis key for presence data
 */
const getPresenceKey = (gameId: string, playerId: string): string => {
  return `presence:game:${gameId}:player:${playerId}`;
};

/**
 * Mark a player as online in a specific game
 * @param gameId - The game ID
 * @param playerId - The player ID
 */
export async function markOnline(gameId: string, playerId: string): Promise<void> {
  try {
    const presenceData: PresenceData = {
      status: "online",
      lastSeen: Date.now(),
    };

    await redis.set(getPresenceKey(gameId, playerId), JSON.stringify(presenceData));
    logger.debug(`Player ${playerId} marked online in game ${gameId}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error marking player ${playerId} online: ${errorMessage}`);
  }
}

/**
 * Mark a player as offline in a specific game
 * @param gameId - The game ID
 * @param playerId - The player ID
 */
export async function markOffline(gameId: string, playerId: string): Promise<void> {
  try {
    const presenceData: PresenceData = {
      status: "offline",
      lastSeen: Date.now(),
    };

    await redis.set(getPresenceKey(gameId, playerId), JSON.stringify(presenceData));
    logger.debug(`Player ${playerId} marked offline in game ${gameId}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error marking player ${playerId} offline: ${errorMessage}`);
  }
}

/**
 * Start a grace timer that will remove the player if they don't reconnect
 * @param gameId - The game ID
 * @param playerId - The player ID
 * @param ms - Grace period in milliseconds (default: 60000)
 * @param onExpire - Callback function to execute when grace period expires
 */
export function startGraceTimer(gameId: string, playerId: string, ms: number, onExpire: () => Promise<void>): void {
  // Clear any existing timer for this player
  clearGraceTimer(gameId, playerId);

  const timerKey = `${gameId}:${playerId}`;
  const timer = setTimeout(async () => {
    try {
      logger.info(`Grace period expired for player ${playerId} in game ${gameId}. Removing player.`);
      await onExpire();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error during grace timer expiry for player ${playerId}: ${errorMessage}`);
    } finally {
      // Clean up the timer
      timers.delete(timerKey);
    }
  }, ms);

  timers.set(timerKey, timer);
  logger.debug(`Started grace timer for player ${playerId} in game ${gameId} (${ms}ms)`);
}

/**
 * Clear the grace timer for a player (called when they reconnect)
 * @param gameId - The game ID
 * @param playerId - The player ID
 */
export function clearGraceTimer(gameId: string, playerId: string): void {
  const timerKey = `${gameId}:${playerId}`;
  const timer = timers.get(timerKey);

  if (timer) {
    clearTimeout(timer);
    timers.delete(timerKey);
    logger.debug(`Cleared grace timer for player ${playerId} in game ${gameId}`);
  }
}

/**
 * Get presence data for a player
 * @param gameId - The game ID
 * @param playerId - The player ID
 * @returns Presence data or null if not found
 */
export async function getPresence(gameId: string, playerId: string): Promise<PresenceData | null> {
  try {
    const data = await redis.get(getPresenceKey(gameId, playerId));
    return data ? JSON.parse(data) : null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error getting presence for player ${playerId}: ${errorMessage}`);
    return null;
  }
}

// Clean up all timers (useful for server shutdown)
export function clearAllTimers(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer);
  }
  timers.clear();
  logger.info("Cleared all presence timers");
}
