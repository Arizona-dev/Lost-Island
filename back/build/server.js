"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const gameRoutes_1 = __importDefault(require("./routes/gameRoutes"));
const index_1 = require("./config/index");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use("/api/games", gameRoutes_1.default);
(0, index_1.connectDB)(); // Assurez-vous d'implémenter cette fonction dans config/index.ts
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Gestion des événements WebSocket ici
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
