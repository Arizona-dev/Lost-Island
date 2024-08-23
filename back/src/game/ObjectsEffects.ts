import { GameState } from "./Game";
import { WreckageObject, WreckageObjectList } from "./Objects";
import { PlayerState } from "./Player";

// Generic effects

export const handleFoodEffect = (
  gameState: GameState,
  value?: number
): GameState => {
  const foodAdded = value ?? 1;

  const updatedResourceIndicators = {
    ...gameState.resourceIndicators,
    food: gameState.resourceIndicators.food + foodAdded,
  };

  return {
    ...gameState,
    resourceIndicators: updatedResourceIndicators,
  };
};

export const handleWaterEffect = (
  gameState: GameState,
  value?: number
): GameState => {
  const waterAdded = value ?? 1;
  const updatedResourceIndicators = {
    ...gameState.resourceIndicators,
    water: gameState.resourceIndicators.water + waterAdded,
  };

  return {
    ...gameState,
    resourceIndicators: updatedResourceIndicators,
  };
};

export const handleProtectionEffect = (
  gameState: GameState,
  playerId: string
): GameState => {
  // Logic for handling protection effect
  // For example, checking if a player is targeted by a shooting action and negating that effect
  // Update the gameState accordingly
  return gameState;
};

export const handleVoteModifierEffect = (
  gameState: GameState,
  playerId: string,
  value?: number
): GameState => {
  // Update the votePower of the player to 2
  const updatedPlayers = gameState.players.map(player => {
    if (player.id === playerId) {
      return {
        ...player,
        votePower: value ?? 2,
      };
    }
    return player;
  });

  return {
    ...gameState,
    players: updatedPlayers,
  };
};

export const handleStealObjectEffect = (
  gameState: GameState,
  playerId: string,
  targetedPlayersId: string[]
): GameState => {
  // Logic for handling steal object effect
  // For example, stealing an object from another player
  // Update the gameState accordingly
  return gameState;
};

export const handleShootEffect = (
  gameState: GameState,
  playerId: string,
  targetedPlayersId: string[]
): GameState => {
  // Logic for handling shoot effect
  // For example, reducing the health of the targeted player
  // Update the gameState accordingly
  return gameState;
};

export const handleHealEffect = (
  gameState: GameState,
  playerId: string
): GameState => {
  const targetPlayer = gameState.players.find(player => player.id === playerId);
  if (!targetPlayer) {
    throw new Error("Target player not found");
  }

  // Update the target player's status to normal
  const updatedPlayers = gameState.players.map(player => {
    if (player.id === playerId) {
      return {
        ...player,
        status: PlayerState.NORMAL,
      };
    }
    return player;
  });

  return {
    ...gameState,
    players: updatedPlayers,
  };
};

export const handleSicknessEffect = (
  gameState: GameState,
  playerId: string
): GameState => {
  const targetPlayer = gameState.players.find(player => player.id === playerId);
  if (!targetPlayer) {
    throw new Error("Target player not found");
  }

  // Update the target player's status to sick
  const updatedPlayers = gameState.players.map(player => {
    if (player.id === playerId) {
      return {
        ...player,
        status: PlayerState.SICK,
      };
    }
    return player;
  });

  return {
    ...gameState,
    players: updatedPlayers,
  };
};

export const handleSeeCardsEffect = (
  gameState: GameState,
  playerId: string
): GameState => {
  // Logic for handling see cards effect
  // For example, sending the player the list of wreckage objects
  // Update the gameState accordingly
  return gameState;
};

export const handleWeatherEffect = (
  gameState: GameState,
  value?: number
): GameState => {
  const weatherValue = value ?? 1;

  // Update the gameState based on the weather effect
  return gameState;
};

// Object effects

export const handleVegetableGrinder = (
  gameState: GameState,
  playerId: string
): GameState => {
  // Logic for handling vegetable grinder effect
  // For example, converting food to water
  // Update the gameState accordingly
  return gameState;
};

export const handleShamanKit = (
  gameState: GameState,
  playerId: string
): GameState => {
  // Logic for handling shaman kit effect
  // For example, healing a player
  // Update the gameState accordingly
  return gameState;
};

export const handleWhetstone = (
  gameState: GameState,
  playerId: string
): GameState => {
  // Logic for handling whetstone effect
  // For example, increasing the player's attack power
  // Update the gameState accordingly
  return gameState;
};
