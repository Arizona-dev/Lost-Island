import io from "socket.io-client";
import config from "./config";

const SOCKET_IO_URL = config.api.url;

const socket = io(SOCKET_IO_URL);

// fetch number of players online
socket.on("connect", () => {
  console.log("Connecté au serveur de jeu");
});

/**
 * Helper to get session token for WebSocket events
 */
export const getSessionToken = (): string | null => {
  return localStorage.getItem("sessionToken");
};

export default socket;
