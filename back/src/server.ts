import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { connectDB } from "./config/index";
import gameRoutes from "./routes/gameRoutes";
import authRoutes from "./routes/authRoutes";
import { initializeWebSocket } from "./websocket";
import logger from "./utils/logger";

const app = express();
const httpServer = createServer(app);
let io: Server | null = null;

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: corsOrigin.split(",").map(origin => origin.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);

connectDB();

io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io is not initialized - make sure to initialize before using it."
    );
  }
  return io;
};

initializeWebSocket();

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
