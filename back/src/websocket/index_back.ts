import { Server } from "socket.io";
import { Express } from "express";

export const initializeWebSocket = (app: Express, server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // Memory Cache to store game states
  const gamesCache = new Map();

  // Utility function to get game state
  function getGameState(gameId: string) {
    return gamesCache.get(gameId);
  }

  // Utility function to set game state
  function setGameState(gameId: string, state: any) {
    gamesCache.set(gameId, state);
  }

  io.on("connection", socket => {
    console.log(`Nouveau client connecté: ${socket.id}`);

    // Gestion de la récupération du nombre de joueurs en ligne
    socket.on("getOnlinePlayers", () => {
      const onlinePlayers = io.engine.clientsCount;
      console.log(`Nombre de joueurs en ligne: ${onlinePlayers}`);
      // Diffusez le nombre de joueurs en ligne à tous les clients
      io.emit("onlinePlayers", onlinePlayers);
    });

    // Gestion de la connexion à une partie
    socket.on("joinGame", ({ gameId, playerId, playerName }) => {
      console.log(`Utilisateur ${playerName} a rejoint le jeu ${gameId}`);
      socket.join(gameId);
      // Vous pouvez notifier les autres joueurs de la connexion
      socket.to(gameId).emit("playerJoined", { playerId, playerName });
    });

    // Start game event
    socket.on("startGame", ({ gameId }) => {
      const gameState = getGameState(gameId);
      if (gameState) {
        gameState.status = "started";
        const firstPlayerId = gameState.players[0].user.id; // assuming players array is populated
        gameState.currentTurn = firstPlayerId;
        setGameState(gameId, gameState);
        io.to(gameId).emit("gameStarted", { firstPlayerId });
        io.to(firstPlayerId).emit("yourTurn");
      }
    });

    // Handle game action and turn management
    socket.on("gameAction", ({ gameId, playerId, action }) => {
      const gameState = getGameState(gameId);
      if (gameState.currentTurn === playerId) {
        // Process the action here (e.g., update game state)
        console.log(
          `Action received from ${playerId} in game ${gameId}: `,
          action
        );

        // Move to the next player
        const playerIndex = gameState.players.findIndex(
          (p: any) => p.user.id === playerId
        );
        const nextPlayerIndex = (playerIndex + 1) % gameState.players.length;
        gameState.currentTurn = gameState.players[nextPlayerIndex].user.id;
        setGameState(gameId, gameState);

        // Notify the next player
        io.to(gameState.currentTurn).emit("yourTurn");
        io.to(gameId).emit("actionProcessed", { playerId, action });
      } else {
        socket.emit("error", "Not your turn");
      }
    });

    // Gestion des tours de jeu
    socket.on("gameTurn", data => {
      const { gameId, player } = data;
      console.log(`Tour de jeu pour le joueur ${player} dans le jeu ${gameId}`);
      // Diffusez le tour de jeu à tous les joueurs dans la même partie
      io.to(gameId).emit("turnReceived", player);
    });

    // Gestion de la déconnexion d'un client
    socket.on("disconnect", () => {
      console.log(`Client déconnecté: ${socket.id}`);
      const onlinePlayers = io.engine.clientsCount;
      io.emit("onlinePlayers", onlinePlayers);
    });
  });

  return io;
};
