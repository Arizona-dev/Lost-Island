import {
  handleCollectWaterAction,
  handleCollectWoodAction,
  handleFishingAction,
  handleSearchWreckageAction,
} from "./Actions";
import { WreckageObject, handleUseObject } from "./Objects";
import { GameState, getGameState, setGameState, Voting, GameStatus } from "./Game";
import { Server } from "socket.io";
import logger from "../utils/logger";
import { endGame } from "./Game";

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
    logger.warn("No players found to shuffle");
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

    // Check if player is dead
    const player = gameState.players.find(p => p.id === playerId);
    if (player?.status === PlayerState.DEAD) {
      throw new Error("Vous êtes mort et ne pouvez plus effectuer d'actions");
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    io.to(playerId).emit("error", { message: errorMessage });
    throw new Error(`[handlePlayerAction] Error: ${errorMessage}`);
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

  // Dead players cannot vote
  if (player.status === PlayerState.DEAD) {
    throw new Error("Vous êtes mort et ne pouvez plus voter");
  }

  // Check if player is sick - sick players cannot vote (unless they are the target)
  if (player.status === PlayerState.SICK) {
    throw new Error("Les joueurs malades ne peuvent pas voter");
  }

  // Prevent players from voting for themselves
  if (playerId === targetPlayerId) {
    throw new Error("Vous ne pouvez pas voter pour vous-même");
  }

  // Find the target player who is being voted against
  const targetPlayer = gameState.players.find(
    player => player.id === targetPlayerId
  );
  if (!targetPlayer) {
    throw new Error("Target player not found");
  }

  // Check if the player has already voted - if so, remove their previous vote (allow changing vote)
  const existingVoteIndex = gameState.voting.findIndex(
    vote => vote.playerId === playerId
  );
  let updatedVoting: Voting[] = [];
  
  if (existingVoteIndex >= 0) {
    // Remove existing vote and add new one
    updatedVoting = [
      ...gameState.voting.slice(0, existingVoteIndex),
      ...gameState.voting.slice(existingVoteIndex + 1),
      {
        playerId,
        targetPlayerId,
        votePower: player.voteCount,
      },
    ];
  } else {
    // Add new vote
    updatedVoting = [
      ...gameState.voting,
      {
        playerId,
        targetPlayerId,
        votePower: player.voteCount,
      },
    ];
  }

  // Count players who can vote (exclude sick and dead players)
  const playersWhoCanVote = gameState.players.filter(
    p => p.status !== PlayerState.SICK && p.status !== PlayerState.DEAD
  ).length;

  // Check if everyone who can vote has voted
  if (updatedVoting.length === playersWhoCanVote) {
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
      isVotingActive: false,
      votingReason: undefined,
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
};

// Finalize vote when timer expires or all players have voted
export const finalizeVote = (gameState: GameState): GameState => {
  if (!gameState.isVotingActive) {
    // If voting is not active, return state unchanged
    return {
      ...gameState,
      voting: [],
      isVotingActive: false,
      votingReason: undefined,
      voteStartTime: undefined,
    };
  }

  // Get alive players (those who can be killed)
  const alivePlayers = gameState.players.filter(
    player => player.status !== PlayerState.DEAD
  );

  // If no alive players, return state unchanged
  if (alivePlayers.length === 0) {
    return {
      ...gameState,
      voting: [],
      isVotingActive: false,
      votingReason: undefined,
      voteStartTime: undefined,
    };
  }

  let selectedPlayerId: string;

  if (gameState.voting.length === 0) {
    // If no votes, randomly select an alive player
    const randomIndex = Math.floor(Math.random() * alivePlayers.length);
    selectedPlayerId = alivePlayers[randomIndex].id;
    logger.info(`No votes received. Randomly selected player ${selectedPlayerId} to die.`);
  } else {
    // Count votes for each player
    const voteCounts = gameState.voting.reduce(
      (acc, vote) => {
        acc[vote.targetPlayerId] =
          (acc[vote.targetPlayerId] || 0) + vote.votePower;
        return acc;
      },
      {} as Record<string, number>
    );

    // Filter votes to only include alive players
    const aliveVoteCounts: Record<string, number> = {};
    alivePlayers.forEach(player => {
      if (voteCounts[player.id] !== undefined) {
        aliveVoteCounts[player.id] = voteCounts[player.id];
      }
    });

    // If no votes for alive players, randomly select one
    if (Object.keys(aliveVoteCounts).length === 0) {
      const randomIndex = Math.floor(Math.random() * alivePlayers.length);
      selectedPlayerId = alivePlayers[randomIndex].id;
      logger.info(`All votes were for dead players. Randomly selected player ${selectedPlayerId} to die.`);
    } else {
      // Find the maximum vote count
      const maxVotes = Math.max(...Object.values(aliveVoteCounts), 0);

      // Get all players with the maximum votes (handle ties)
      const playersWithMaxVotes = Object.keys(aliveVoteCounts).filter(
        playerId => aliveVoteCounts[playerId] === maxVotes
      );

      // If there's a tie, randomly select among tied players
      if (playersWithMaxVotes.length > 1) {
        const randomIndex = Math.floor(Math.random() * playersWithMaxVotes.length);
        selectedPlayerId = playersWithMaxVotes[randomIndex];
        logger.info(`Tie in votes. Randomly selected player ${selectedPlayerId} among tied players.`);
      } else {
        // Only one player has the most votes
        selectedPlayerId = playersWithMaxVotes[0];
      }
    }
  }

  // Update players first (mark selected player as dead)
  const updatedPlayers = gameState.players.map(player => {
    if (player.id === selectedPlayerId) {
      return { ...player, status: PlayerState.DEAD };
    }
    return player;
  });

  // After a vote, find the next player in the original order to start the round
  // The key rule: NEVER start with the last player, always start with the NEXT player
  // This should match switchFirstPlayer logic: find the next player after the current one
  // The current player (gameState.playerIdTurn) is the one who was playing when vote started
  
  // Important: If the current player died during the vote, we still need to find the next player
  // after them in the original order (even if they're now dead)
  const currentPlayerIndex = updatedPlayers.findIndex(
    player => player.id === gameState.playerIdTurn
  );
  
  logger.debug(`finalizeVote: Current player (when vote started) is ${gameState.playerIdTurn} at index ${currentPlayerIndex}`);
  logger.debug(`finalizeVote: Updated players order is ${updatedPlayers.map(p => `${p.id}(${p.status})`).join(", ")}`);
  
  // Find the next alive player after the current player in the original order
  // This ensures we NEVER start with the same player that just finished
  // Example: If M was playing and vote started, next should be Z (the first player, wrapping around)
  let nextIndex = currentPlayerIndex === -1 ? 0 : (currentPlayerIndex + 1) % updatedPlayers.length;
  let attempts = 0;
  let nextAlivePlayer: Player | undefined;
  
  while (attempts < updatedPlayers.length) {
    const nextPlayer = updatedPlayers[nextIndex];
    if (nextPlayer.status !== PlayerState.DEAD) {
      nextAlivePlayer = nextPlayer;
      break;
    }
    nextIndex = (nextIndex + 1) % updatedPlayers.length;
    attempts++;
  }
  
  // Fallback to first alive player if we couldn't find next one
  // This should only happen if currentPlayerIndex was -1 (player not found)
  if (!nextAlivePlayer) {
    nextAlivePlayer = updatedPlayers.find(player => player.status !== PlayerState.DEAD);
    logger.warn(`finalizeVote: Could not find next player after ${gameState.playerIdTurn}, using first alive player instead`);
  }
  
  if (!nextAlivePlayer) {
    logger.warn("No alive player found after vote - this should not happen");
    return {
      ...gameState,
      players: updatedPlayers,
      voting: [],
      isVotingActive: false,
      votingReason: undefined,
      voteStartTime: undefined,
      playerIdTurn: gameState.playerIdTurn,
      eventLog: [
        ...gameState.eventLog,
        {
          type: "VOTE_RESULT",
          data: { playerId: selectedPlayerId },
        },
      ],
    };
  }

  // Ensure we're not starting with the same player that was playing when vote started
  if (nextAlivePlayer.id === gameState.playerIdTurn) {
    logger.warn(`finalizeVote: Warning! Next player ${nextAlivePlayer.id} is the same as current player ${gameState.playerIdTurn}. This should not happen.`);
    // Find the next player after this one
    const samePlayerIndex = updatedPlayers.findIndex(p => p.id === nextAlivePlayer!.id);
    let nextAfterSame = (samePlayerIndex + 1) % updatedPlayers.length;
    attempts = 0;
    while (attempts < updatedPlayers.length) {
      const afterPlayer = updatedPlayers[nextAfterSame];
      if (afterPlayer.status !== PlayerState.DEAD && afterPlayer.id !== gameState.playerIdTurn) {
        nextAlivePlayer = afterPlayer;
        logger.debug(`finalizeVote: Found alternative next player ${nextAlivePlayer.id}`);
        break;
      }
      nextAfterSame = (nextAfterSame + 1) % updatedPlayers.length;
      attempts++;
    }
  }

  logger.info(`After vote, player ${selectedPlayerId} died. Next turn will be ${nextAlivePlayer.id} (next player in original order after ${gameState.playerIdTurn})`);

  const finalState = {
    ...gameState,
    players: updatedPlayers,
    voting: [],
    isVotingActive: false,
    votingReason: undefined,
    voteStartTime: undefined,
    playerIdTurn: nextAlivePlayer.id, // Set turn to next player in original order after vote
    eventLog: [
      ...gameState.eventLog,
      {
        type: "VOTE_RESULT",
        data: { playerId: selectedPlayerId },
      },
    ],
  };

  // Check if only one player remains alive after the vote
  const remainingAlivePlayers = updatedPlayers.filter(player => player.status !== PlayerState.DEAD);
  if (remainingAlivePlayers.length === 1 && (gameState.resourceIndicators.water < 1 || gameState.resourceIndicators.food < 1)) {
    // Last player will die due to insufficient resources, end game
    const lastPlayer = remainingAlivePlayers[0];
    logger.info(`Only one player ${lastPlayer.id} remains and resources are insufficient. Game over.`);
    
    const finalPlayers = finalState.players.map(player => {
      if (player.id === lastPlayer.id) {
        return { ...player, status: PlayerState.DEAD };
      }
      return player;
    });

    const endedState = {
      ...finalState,
      players: finalPlayers,
      status: GameStatus.ENDED,
    };

    // End the game async (don't await to avoid blocking)
    endGame(endedState).catch(err => {
      logger.error(`Error ending game: ${err}`);
    });

    return endedState;
  }

  return finalState;
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
