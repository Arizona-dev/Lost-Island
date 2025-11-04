import { Request, Response, NextFunction } from "express";
import { validateSession } from "../utils/sessionManager";

// Extend Express Request type to include session data
declare global {
  namespace Express {
    interface Request {
      session?: {
        playerId: string;
        playerName: string;
        createdAt: number;
      };
    }
  }
}

/**
 * Middleware to validate session token from Authorization header
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header (format: "Bearer <token>")
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No authorization token provided" });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    const sessionData = await validateSession(token);
    
    if (!sessionData) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    // Attach session data to request
    req.session = sessionData;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Optional authentication middleware - doesn't block if no token
 * but validates and attaches session if token is present
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const sessionData = await validateSession(token);
      
      if (sessionData) {
        req.session = sessionData;
      }
    }
    
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue even if auth fails
  }
};

