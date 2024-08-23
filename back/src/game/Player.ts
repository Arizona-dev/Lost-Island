import {
  handleCollectWaterAction,
  handleCollectWoodAction,
  handleFishingAction,
  handleSearchWreckageAction,
} from "./Actions";
import { WreckageObject, handleUseObject } from "./Objects";
import { GameState, getGameState, setGameState } from "./Game";
import { Server } from "socket.io";

export enum PlayerState {
  NORMAL = "normal",
  SICK = "sick",
  DEAD = "dead",
}

export type Player = {
  id: string;
  name: string;
  voteCount: number;
  status: PlayerState;
  objects: WreckageObject[];
};

export const shufflePlayers = (players: Player[]): Player[] => {
  if (!players || players.length === 0) {
    console.log("No players found to shuffle");
    return [];
  }

  // Create a copy of the players array to avoid modifying the original array
  const shuffledPlayers = [...players];

  // Fisher-Yates shuffle
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [
      shuffledPlayers[j],
      shuffledPlayers[i],
    ];
  }

  return shuffledPlayers;
};

export enum PlayerAction {
  FISH = "FISH",
  COLLECT_WATER = "COLLECT_WATER",
  COLLECT_WOOD = "COLLECT_WOOD",
  SEARCH_WRECKAGE = "SEARCH_WRECKAGE",
  USE_OBJECT = "USE_OBJECT",
}

export const handlePlayerAction = async (
  io: Server,
  gameId: string,
  playerId: string,
  action_type: PlayerAction,
  data: {
    objectId?: string;
    targetedPlayersId?: string[];
    woodToCollect?: number;
  }
): Promise<GameState> => {
  try {
    let gameState = await getGameState(gameId);
    if (!gameState) {
      throw new Error("Game not found");
    }

    switch (action_type) {
      case PlayerAction.FISH:
        const fish = handleFishingAction();
        gameState = {
          ...gameState,
          resourceIndicators: {
            ...gameState.resourceIndicators,
            food: gameState.resourceIndicators.food + fish,
          },
          eventLog: [
            ...gameState.eventLog,
            {
              type: "PLAYER_ACTION",
              data: { playerId, action_type, value: fish },
            },
          ],
        };
        break;

      case PlayerAction.COLLECT_WATER:
        const water = handleCollectWaterAction(gameState.weatherList[0].water);
        gameState = {
          ...gameState,
          resourceIndicators: {
            ...gameState.resourceIndicators,
            water: gameState.resourceIndicators.water + water,
          },
          eventLog: [
            ...gameState.eventLog,
            {
              type: "PLAYER_ACTION",
              data: { playerId, action_type, value: water },
            },
          ],
        };
        break;

      case PlayerAction.COLLECT_WOOD:
        const wood = handleCollectWoodAction(data.woodToCollect || 1);
        gameState = {
          ...gameState,
          resourceIndicators: {
            ...gameState.resourceIndicators,
            wood:
              gameState.resourceIndicators.wood +
              (wood ? data.woodToCollect || 1 : 0),
          },
          eventLog: [
            ...gameState.eventLog,
            {
              type: "PLAYER_ACTION",
              data: { playerId, action_type, value: wood },
            },
          ],
        };
        break;

      case PlayerAction.SEARCH_WRECKAGE:
        const newObject = handleSearchWreckageAction();
        gameState = {
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
              data: { playerId, action_type },
            },
          ],
        };
        break;

      case PlayerAction.USE_OBJECT:
        gameState = handleUseObject(
          gameState,
          playerId,
          data.objectId,
          data.targetedPlayersId
        );
        break;

      default:
        throw new Error("Invalid action");
    }

    await setGameState(gameId, gameState);
    return gameState;
  } catch (error: any) {
    io.to(playerId).emit("error", { message: error.message });
    throw new Error(`[handlePlayerAction] Error: ${error.message}`);
  }
};

export const handlePlayerVote = (
  gameState: GameState,
  playerId: string,
  targetPlayerId: string
): GameState => {
  // Find the player who is voting
  const player = gameState.players.find(player => player.id === playerId);
  if (!player) {
    throw new Error("Player not found");
  }

  // Find the target player who is being voted against
  const targetPlayer = gameState.players.find(
    player => player.id === targetPlayerId
  );
  if (!targetPlayer) {
    throw new Error("Target player not found");
  }

  // Check if the player has already voted
  const existingVote = gameState.voting.find(
    vote => vote.playerId === playerId
  );
  if (existingVote) {
    throw new Error("Player has already voted");
  }

  // Add the vote to the game state
  const updatedVoting = [
    ...gameState.voting,
    {
      playerId,
      targetPlayerId,
      votePower: player.voteCount,
    },
  ];

  // Check if everyone has voted
  if (updatedVoting.length === gameState.players.length) {
    // Count votes for each player
    const voteCounts = updatedVoting.reduce(
      (acc, vote) => {
        acc[vote.targetPlayerId] =
          (acc[vote.targetPlayerId] || 0) + vote.votePower;
        return acc;
      },
      {} as Record<string, number>
    );

    // Find the player with the most votes
    const mostVotedPlayerId = Object.keys(voteCounts).reduce((acc, curr) =>
      voteCounts[curr] > (voteCounts[acc] || 0) ? curr : acc
    );

    return {
      ...gameState,
      players: gameState.players.map(player => {
        if (player.id === mostVotedPlayerId) {
          return { ...player, status: PlayerState.DEAD };
        }
        return player;
      }),
      voting: [],
      eventLog: [
        ...gameState.eventLog,
        {
          type: "VOTE_RESULT",
          data: { playerId: mostVotedPlayerId },
        },
      ],
    };
  }

  // If not everyone has voted, return the updated game state with the current votes
  return {
    ...gameState,
    voting: updatedVoting,
    eventLog: [
      ...gameState.eventLog,
      {
        type: "VOTE",
        data: { playerId, targetPlayerId },
      },
    ],
  };

  // if everyone has voted, calculate the result of the vote and kill the player with the most votes
  // if (gameState.voting.length === gameState.players.length) {
  //   const mostVotedPlayer = gameState.voting.reduce((acc, curr) =>
  //     curr.votePower > acc.votePower ? curr : acc
  //   );
  //   return {
  //     ...gameState,
  //     players: gameState.players.map(player => {
  //       if (player.id === mostVotedPlayer.playerId) {
  //         return { ...player, status: PlayerState.DEAD };
  //       }
  //       return player;
  //     }),
  //     voting: [],
  //   };
  // }

  // return {
  //   ...gameState,
  //   voting: [
  //     ...gameState.voting,
  //     {
  //       playerId,
  //       targetPlayerId,
  //       votePower: player.voteCount,
  //     },
  //   ],
  //   eventLog: [
  //     ...gameState.eventLog,
  //     {
  //       type: "VOTE",
  //       data: { playerId, targetPlayerId },
  //     },
  //   ],
  // };
};
