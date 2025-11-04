import { Router } from "express";
import {
  loginController,
  logoutController,
  validateSessionController,
} from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Login/Register endpoint - creates a new ephemeral player
router.post("/login", loginController);

// Logout endpoint - invalidates session
router.post("/logout", logoutController);

// Validate session endpoint - checks if token is still valid
router.get("/validate", requireAuth, validateSessionController);

export default router;

