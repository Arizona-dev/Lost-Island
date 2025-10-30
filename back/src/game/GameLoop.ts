// RECAPITULATIF D'UN TOUR DE JEU
// 1. Changement du premier joueur
// 2. Tirer la carte Météo
// 3. Action des joueurs
// Chaque joueur choisit d’effectuer l’une de ces 4 actions :
//   Pêcher du poisson :
//     Piocher une boule dans le sac et déplacer le pion Nourriture du nombre de poisson(s) indiqué (1 à 3).
//   Collecter de l’eau :
//     Déplacer le pion d’eau sur le compteur de vivre du nombre de cases indiqué sur la carte Météo du tour (0 à 3).
//   Collecter du bois et construire le radeau :
//     Avancer le disque Bois d’une étape puis décider de piocher une ou plusieurs boules supplémentaires dans le sac. Si la boule noire n’apparait pas, avancer d’autant d’étapes que de boules blanches piochées. Si le disque atteint l’étape 6, ajouter une carte Place de radeau sur le plateau.
//   Fouiller l’épave Piochez une carte Épave et ajoutez-la à votre main.

import {
  GameState,
  GameStatus,
  decrementResource,
  getNextPlayerTurn,
  setNextDay,
  switchFirstPlayer,
  endGame,
} from "./Game";
import { PlayerState } from "./Player";
import { Game } from "../models/gameModel";
import logger from "../utils/logger";

// 4. Survie des naufragés
// A. Décompte Eau
// B. Décompte Nourriture
// 5. Fin du tour

export const handleGameLoop = async (gameState: GameState): Promise<GameState> => {
  const players = gameState.players;
  const currentPlayerIndex = players.findIndex(
    player => player.id === gameState.playerIdTurn
  );

  // Find the next alive player after the current one
  const nextAlivePlayerId = getNextPlayerTurn(gameState);

  // Count alive players
  const alivePlayers = players.filter(player => player.status !== PlayerState.DEAD);
  const alivePlayerCount = alivePlayers.length;

  // If there's only one player alive, they should keep taking turns,
  // but we still need to check resources after each turn
  if (alivePlayerCount === 1) {
    logger.debug(`Only one player ${alivePlayers[0].id} is alive. Checking resources after their turn.`);

    // For single player, simulate a "cycle completion" to trigger resource checks
    // 1. Change the first player (will be the same player since only one alive)
    let newState = switchFirstPlayer(gameState);

    // 2. Draw the next weather card and set the next day
    newState = setNextDay(newState);

    // 3. Player actions (Handled outside this function before calling it)

    // 4. Survival checks
    const { newState: updatedState, needsVoting, gameEnded } = decrementResource(newState);

    // If game ended (last player died), end the game
    if (gameEnded) {
      logger.info("Game ended: last player died due to insufficient resources");
      await endGame(updatedState);
      return updatedState;
    }

    // Check if resources are exhausted and set voting active if necessary
    // (Though with only one player, voting doesn't make sense, but we'll handle it)
    if (needsVoting) {
      logger.info(`Single player: Resources are exhausted. This should trigger game end.`);
      // For single player, if resources are exhausted, they should die
      const singlePlayer = alivePlayers[0];
      const updatedPlayers = gameState.players.map(player => {
        if (player.id === singlePlayer.id) {
          return { ...player, status: PlayerState.DEAD };
        }
        return player;
      });

      const endedState = {
        ...updatedState,
        players: updatedPlayers,
        status: GameStatus.ENDED,
      };

      await endGame(endedState);
      return endedState;
    }

    // Continue with the same player for next turn
    return {
      ...updatedState,
      playerIdTurn: nextAlivePlayerId,
    };
  }

  // Find the first alive player in the CURRENT order (this is the cycle start for this day)
  const firstAlivePlayerInCurrentOrder = players.find(player => player.status !== PlayerState.DEAD);

  if (!firstAlivePlayerInCurrentOrder) {
    logger.warn("No alive player found in handleGameLoop");
    return gameState;
  }

  // If the next alive player is the same as the first alive player in the current order,
  // we've completed a full cycle of all alive players in this round
  const hasCompletedCycle = nextAlivePlayerId === firstAlivePlayerInCurrentOrder.id;

  // Check if it's NOT the last alive player's turn (continue to next player)
  if (!hasCompletedCycle) {
    logger.debug(
      `Player ${players[currentPlayerIndex].id} has finished their turn. Passing to next player ${nextAlivePlayerId}.`
    );
    return {
      ...gameState,
      playerIdTurn: nextAlivePlayerId,
    };
  }

  logger.debug(
    `Last alive player ${players[currentPlayerIndex].id} has finished their turn. Moving to next round.`
  );

  // 1. Change the first player (find next player in original order, don't rotate list)
  let newState = switchFirstPlayer(gameState);

  // 2. Draw the next weather card and set the next day
  newState = setNextDay(newState);

  // 3. Player actions (Handled outside this function before calling it)

  // 4. Survival checks
  const { newState: updatedState, needsVoting, gameEnded } = decrementResource(newState);

  // If game ended (last player died), end the game
  if (gameEnded) {
    logger.info("Game ended: last player died due to insufficient resources");
    await endGame(updatedState);
    return updatedState;
  }

  // Check if resources are exhausted and set voting active if necessary
  if (needsVoting) {
    logger.info(`Resources are exhausted. Voting phase is activated for ${updatedState.votingReason || "unknown reason"}.`);
    // Initialize vote timer - get voteDuration from database
    const game = await Game.findById(updatedState.id);
    const voteDuration = game?.voteDuration || 30;
    const voteStartTime = Date.now();
    return {
      ...updatedState,
      isVotingActive: true,
      voteStartTime,
      voteDuration,
      voting: [], // Reset votes
    };
  }

  // 5. End the turn and prepare for the next round
  logger.debug("Round completed. Moving to the next round.");
  return updatedState;
};
