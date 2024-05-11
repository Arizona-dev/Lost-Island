import express from "express";
import cors from "cors";
import { createServer } from "http";
import { connectDB } from "./config/index";
import gameRoutes from "./routes/gameRoutes";
import { initializeWebSocket } from "./websocket";
import logger from "./utils/logger";

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: "http://localhost:5173", // Remplacez par l'origine de votre frontend si différente
    credentials: true, // Permet les cookies CORS
  })
);
app.use(express.json());
app.use("/api/games", gameRoutes);

connectDB();

initializeWebSocket(app, httpServer);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
