import axios from "axios";
import config from "../config";

const API_URL = config.api.url + "/api/auth";

interface LoginResponse {
  playerId: string;
  playerName: string;
  sessionToken: string;
}

/**
 * Login or register a new ephemeral player
 * @param playerName - The player's display name
 * @returns Login response with playerId and session token
 */
export const login = async (playerName: string): Promise<LoginResponse> => {
  try {
    const { data } = await axios.post<LoginResponse>(`${API_URL}/login`, {
      playerName,
    });
    
    // Store credentials in localStorage
    localStorage.setItem("playerName", data.playerName);
    localStorage.setItem("playerId", data.playerId);
    localStorage.setItem("sessionToken", data.sessionToken);
    
    return data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

/**
 * Logout - clear session from server and localStorage
 */
export const logout = async (): Promise<void> => {
  try {
    const sessionToken = localStorage.getItem("sessionToken");
    
    if (sessionToken) {
      await axios.post(
        `${API_URL}/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );
    }
  } catch (error) {
    console.error("Error during logout:", error);
  } finally {
    // Clear localStorage regardless of API call success
    localStorage.removeItem("playerName");
    localStorage.removeItem("playerId");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("lobbyPasswords");
  }
};

/**
 * Validate current session
 * @returns true if session is valid, false otherwise
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    const sessionToken = localStorage.getItem("sessionToken");
    
    if (!sessionToken) {
      return false;
    }

    await axios.get(`${API_URL}/validate`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    
    return true;
  } catch (error) {
    console.error("Session validation failed:", error);
    // Clear invalid session
    localStorage.removeItem("sessionToken");
    return false;
  }
};

/**
 * Get the current session token
 * @returns The session token or null if not logged in
 */
export const getSessionToken = (): string | null => {
  return localStorage.getItem("sessionToken");
};

export default { login, logout, validateSession, getSessionToken };

