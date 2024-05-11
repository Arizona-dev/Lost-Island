import {
  handleCollectWaterAction,
  handleCollectWoodAction,
  handleFishingAction,
  handleSearchWreckageAction,
} from "./Actions";
import { WreckageObject, WreckageObjects, handleUseObject } from "./Objects";
import { getGameState, setGameState } from "./Game";

export type Player = {
  id: string;
  name: string;
  voteCount: number;
  status: "normal" | "sick" | "dead";
  objects: WreckageObject[];
};

// Shuffle players to randomize the order of turns at the beginning of the game
export const shufflePlayers = (players: Player[]) => {
  if (!players) {
    console.log("No players found");
    return [];
  }
  // Fisher-Yates shuffle
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  return players;
};

export type PlayerAction =
  | { type: "FISH" }
  | { type: "COLLECT_WATER" }
  | { type: "COLLECT_WOOD" }
  | { type: "SEARCH_WRECKAGE" }
  | { type: "USE_OBJECT"; objectId: WreckageObjects };

export const handlePlayerAction = async (
  io: any,
  gameId: string,
  playerId: string,
  action: PlayerAction,
  woodToCollect?: number
) => {
  switch (action.type) {
    case "FISH":
      const fish = handleFishingAction();
      return await getGameState(gameId)
        .then(gameState => {
          if (!gameState) {
            return io.to(playerId).emit("error", "Game not found");
          }

          const newState = {
            ...gameState,
            resourceIndicators: {
              ...gameState.resourceIndicators,
              food: gameState.resourceIndicators.food + fish,
            },
            eventLog: [
              ...gameState.eventLog,
              {
                type: "PLAYER_ACTION",
                data: { playerId, action, value: fish },
              },
            ],
          };
          setGameState(gameId, newState).then(() => {
            io.to(gameId).emit("game_state", newState);
          });
        })
        .catch(() => {
          io.to(playerId).emit("error", "Game not found");
        });

    case "COLLECT_WATER":
      return await getGameState(gameId)
        .then(gameState => {
          if (!gameState) {
            return io.to(playerId).emit("error", "Game not found");
          }

          const water = handleCollectWaterAction(
            gameState.weatherList[0].water
          );
          const newState = {
            ...gameState,
            resourceIndicators: {
              ...gameState.resourceIndicators,
              water: gameState.resourceIndicators.water + water,
            },
            eventLog: [
              ...gameState.eventLog,
              {
                type: "PLAYER_ACTION",
                data: { playerId, action, value: water },
              },
            ],
          };
          setGameState(gameId, newState).then(() => {
            io.to(gameId).emit("game_state", newState);
          });
        })
        .catch(() => {
          io.to(playerId).emit("error", "Game not found");
        });
    case "COLLECT_WOOD":
      const wood = handleCollectWoodAction(woodToCollect || 1);
      return await getGameState(gameId)
        .then(gameState => {
          if (!gameState) {
            return io.to(playerId).emit("error", "Game not found");
          }

          const newState = {
            ...gameState,
            resourceIndicators: {
              ...gameState.resourceIndicators,
              wood:
                gameState.resourceIndicators.wood +
                (wood ? woodToCollect || 1 : 0),
            },
            eventLog: [
              ...gameState.eventLog,
              {
                type: "PLAYER_ACTION",
                data: { playerId, action, value: wood },
              },
            ],
          };
          setGameState(gameId, newState).then(() => {
            io.to(gameId).emit("game_state", newState);
          });
        })
        .catch(() => {
          io.to(playerId).emit("error", "Game not found");
        });
    case "SEARCH_WRECKAGE":
      return await getGameState(gameId)
        .then(gameState => {
          if (!gameState) {
            return io.to(playerId).emit("error", "Game not found");
          }

          const newObject = handleSearchWreckageAction();

          const newState = {
            ...gameState,
            players: gameState.players.map(player => {
              if (player.id === playerId) {
                return {
                  ...player,
                  objects: [...player.objects, newObject],
                };
              }
              return player;
            }),
            eventLog: [
              ...gameState.eventLog,
              {
                type: "PLAYER_ACTION",
                data: { playerId, action },
              },
            ],
          };
          setGameState(gameId, newState).then(() => {
            io.to(gameId).emit("game_state", newState);
          });
        })
        .catch(() => {
          io.to(playerId).emit("error", "Game not found");
        });
    case "USE_OBJECT":
      return handleUseObject(io, gameId, playerId, action.objectId);
  }
};
