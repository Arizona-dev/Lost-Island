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
  decrementResource,
  getNextPlayerTurn,
  setNextDay,
  switchFirstPlayer,
} from "./Game";

// 4. Survie des naufragés
// A. Décompte Eau
// B. Décompte Nourriture
// 5. Fin du tour

export const handleGameLoop = (gameState: GameState): GameState => {
  const players = gameState.players;
  const currentPlayerIndex = players.findIndex(
    player => player.id === gameState.playerIdTurn
  );

  // Check if it's the last player's turn
  if (currentPlayerIndex !== players.length - 1) {
    console.log(
      `Player ${players[currentPlayerIndex].id} has finished their turn. Passing to next player.`
    );
    return {
      ...gameState,
      playerIdTurn: getNextPlayerTurn(gameState),
    };
  }

  console.log(
    `Last player ${players[currentPlayerIndex].id} has finished their turn. Moving to next round.`
  );

  // 1. Change the first player
  let newState = switchFirstPlayer(gameState);

  // 2. Draw the next weather card and set the next day
  newState = setNextDay(newState);

  // 3. Player actions (Handled outside this function before calling it)

  // 4. Survival checks
  const { newState: updatedState, needsVoting } = decrementResource(newState);

  // Check if resources are exhausted and set voting active if necessary
  if (needsVoting) {
    console.log(`Resources are exhausted. Voting phase is activated.`);
    return {
      ...updatedState,
      isVotingActive: true,
    };
  }

  // 5. End the turn and prepare for the next round
  console.log(`Round completed. Moving to the next round.`);
  return newState;
};
