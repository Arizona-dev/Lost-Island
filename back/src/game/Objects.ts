import { GameState } from "./Game";
import {
  handleFoodEffect,
  handleHealEffect,
  handleProtectionEffect,
  handleSeeCardsEffect,
  handleShamanKit,
  handleShootEffect,
  handleSicknessEffect,
  handleStealObjectEffect,
  handleVegetableGrinder,
  handleVoteModifierEffect,
  handleWaterEffect,
  handleWeatherEffect,
  handleWhetstone,
} from "./ObjectsEffects";

export enum EffectType {
  "NOTHING" = "nothing",
  "FOOD" = "food",
  "WATER" = "water",
  "WOOD" = "wood",
  "PROTECTION" = "protection",
  "VOTE_MODIFIER" = "vote_modifier",
  "STEAL_OBJECT" = "steal_object",
  "SHOOT" = "shoot",
  "HEAL" = "heal",
  "SICKNESS" = "sickness",
  "SEE_OBJECTS" = "see_objects",
  "WEATHER" = "weather",
}

export type Effect = {
  type: EffectType;
  value?: number;
};

export type WreckageObject = {
  id: string;
  usage: "unique" | "permanent";
  description: string;
  effects: Effect[];
  image: string;
  isHidden: boolean;
};

// Clé de voiture de luxe : Cet objet ne sert à rien, même pas à faire le malin.
// Jeu de société puissance 4 : Cet objet (ne sert à rien) est génial (vous allez enfin pouvoir faire passer le temps de façon agréable).
// Vieux slip : Cet objet ne sert à rien, si ce n'est vous apporter un peu de réconfort.
// Plaque de tôle : Me protège d'un tir de revolver.
// Kit BBQ Cannibale : A la fin d'un tour, ajoute 2 rations de nourriture pour chaque naufragé mort durant le tour.
// Poupée vaudou : Permet de ressusciter un naufragé de mon choix au début d'un tour.
// Anti-venin : Soigne une morsure de serpent. Je ne suis pas malade mais je perds le bois.
// Somnifère : Me permet de voler une carte au hasard à 3 naufragés.
// Revolver : Permet d'abattre un naufragé de mon choix lorsque j'ai une cartouche. (Usage permanent. Carte récupérée en cas d'élimination de son propriétaire).
// Bouteille d'eau : Me permet de boire une ration d'eau.
// Sandwich : Me permet de manger une ration de nourriture.
// Eau croupie : Equivalent à une ration d'eau mais rend malade pour 1 tour.
// Noix de coco : Me permet de manger une ration de nourriture.
// Cartouche : A utiliser avec le revolver pour abattre un naufragé. (Usage unique).
// Conque : Durant ce tour, je suis le chef et personne ne peut voter contre moi. Cette carte peut être jouée avant ou après un vote.
// Lampe torche : Permet de regarder les 3 premières cartes Épave du paquet et d'en choisir une. Les autres sont remises dans le paquet. Sans le montrer aux autres joueurs.
// Longue-vue : Avec cette longue-vue, je peux voir secrètement les cartes des autres naufragés.
// Panier garni : En cas de pénurie, aucun naufragé ne meurt de faim ou de soif, mais le(s) compteur(s) concerné(s) sont remis à zéro (ce panier ne peut pas être utilisé pour quitter l'île).
// Gourde : Me permet de récupérer 2 fois plus d'eau à chaque fois que je collecte de l'eau. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).
// Boule de cristal : Me permet de voter en dernier lors d'un vote. (Usage permanent, carte défaussée en cas d'élmination de son propriétaire).
// Balle dum-dum : A utiliser avec le revolver pour abattre un naufragé. Traverse les plaques de tôle et la plaque concave. (Usage unique)
// Plaque concave : Si quelqu'un me tire dessus, la balle ricoche sur mon voisin de gauche.
// Hache : A chaque tour, me permet de récupérer 2 morceaux de bois sans risque si je choisis l'action "Ramasser du bois". (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).
// Gourdin : Donne 2 voix lors de chaque vote. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).
// Ticket de loterie gagnant : Cet objet ne sert à rien (mais dire que vous auriez pu vous acheter un bateau avec...).
// Moulin à légumes : Permet de transformer 2 rations de nourriture en 2 rations d'eau.
// Kit Chaman : Si la météo est à zéro pour ce tour, cette carte permet de la passer à 1.
// Pierre à aiguiser : Associée à la hache, me permet de tuer un de mes voisins. La gache est défaussée après cet usage.
// Chat : En cas de pénurie uniquement, donne 2 rations de nourriture.
// Taser : Permet de voler une carte à effet permanent qui se trouve devant un autre joueur.

export enum WreckageObjectList {
  LUXURY_CAR_KEY = "luxury_car_key",
  BOARD_GAME = "board_game",
  OLD_UNDERWEAR = "old_underwear",
  TIN_PLATE = "tin_plate",
  CANNIBAL_BBQ_KIT = "cannibal_bbq_kit",
  VOODOO_DOLL = "voodoo_doll",
  ANTIVENOM = "antivenom",
  SLEEPING_PILL = "sleeping_pill",
  REVOLVER = "revolver",
  WATER_BOTTLE = "water_bottle",
  SANDWICH = "sandwich",
  STALE_WATER = "stale_water",
  COCONUT = "coconut",
  BULLET = "bullet",
  SHELL = "shell",
  FLASHLIGHT = "flashlight",
  TELESCOPE = "telescope",
  BASKET = "basket",
  FLASK = "flask",
  CRYSTAL_BALL = "crystal_ball",
  DUM_DUM_BULLET = "dum_dum_bullet",
  CONCAVE_PLATE = "concave_plate",
  AXE = "axe",
  CLUB = "club",
  LOTTERY_TICKET = "lottery_ticket",
  VEGETABLE_GRINDER = "vegetable_grinder",
  SHAMAN_KIT = "shaman_kit",
  WHETSTONE = "whetstone",
  CAT = "cat",
  TASER = "taser",
}

export const allObjects: WreckageObject[] = [
  {
    id: WreckageObjectList.LUXURY_CAR_KEY,
    usage: "unique",
    description: "Cet objet ne sert à rien, même pas à faire le malin.",
    effects: [{ type: EffectType.NOTHING }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.BOARD_GAME,
    usage: "unique",
    description:
      "Cet objet (ne sert à rien) est génial (vous allez enfin pouvoir faire passer le temps de façon agréable).",
    effects: [{ type: EffectType.NOTHING }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.OLD_UNDERWEAR,
    usage: "unique",
    description:
      "Cet objet ne sert à rien, si ce n'est vous apporter un peu de réconfort.",
    effects: [{ type: EffectType.NOTHING }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.TIN_PLATE,
    usage: "unique",
    description: "Me protège d'un tir de revolver.",
    effects: [{ type: EffectType.PROTECTION }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.CANNIBAL_BBQ_KIT,
    usage: "unique",
    description:
      "A la fin d'un tour, ajoute 2 rations de nourriture pour chaque naufragé mort durant le tour.",
    effects: [{ type: EffectType.FOOD }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.VOODOO_DOLL,
    usage: "unique",
    description:
      "Permet de ressusciter un naufragé de mon choix au début d'un tour.",
    effects: [{ type: EffectType.HEAL }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.ANTIVENOM,
    usage: "unique",
    description:
      "Soigne une morsure de serpent. Je ne suis pas malade mais je perds le bois.",
    effects: [{ type: EffectType.HEAL }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.SLEEPING_PILL,
    usage: "unique",
    description: "Me permet de voler une carte au hasard à 3 naufragés.",
    effects: [{ type: EffectType.STEAL_OBJECT }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.REVOLVER,
    usage: "permanent",
    description:
      "Permet d'abattre un naufragé de mon choix lorsque j'ai une cartouche. (Usage permanent. Carte récupérée en cas d'élimination de son propriétaire).",
    effects: [{ type: EffectType.SHOOT }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.WATER_BOTTLE,
    usage: "unique",
    description: "Me permet de boire une ration d'eau.",
    effects: [{ type: EffectType.WATER }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.SANDWICH,
    usage: "unique",
    description: "Me permet de manger une ration de nourriture.",
    effects: [{ type: EffectType.FOOD }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.STALE_WATER,
    usage: "unique",
    description: "Equivalent à une ration d'eau mais rend malade pour 1 tour.",
    effects: [{ type: EffectType.SICKNESS }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.COCONUT,
    usage: "unique",
    description: "Me permet de manger une ration de nourriture.",
    effects: [{ type: EffectType.FOOD }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.BULLET,
    usage: "unique",
    description:
      "A utiliser avec le revolver pour abattre un naufragé. (Usage unique).",
    effects: [{ type: EffectType.SHOOT }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.SHELL,
    usage: "unique",
    description:
      "Durant ce tour, je suis le chef et personne ne peut voter contre moi. Cette carte peut être jouée avant ou après un vote.",
    effects: [{ type: EffectType.VOTE_MODIFIER }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.FLASHLIGHT,
    usage: "unique",
    description:
      "Permet de regarder les 3 premières cartes Épave du paquet et d'en choisir une. Les autres sont remises dans le paquet. Sans le montrer aux autres joueurs.",
    effects: [{ type: EffectType.SEE_OBJECTS }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.TELESCOPE,
    usage: "unique",
    description:
      "Avec cette longue-vue, je peux voir secrètement les cartes des autres naufragés.",
    effects: [{ type: EffectType.SEE_OBJECTS }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.BASKET,
    usage: "unique",
    description:
      "En cas de pénurie, aucun naufragé ne meurt de faim ou de soif, mais le(s) compteur(s) concerné(s) sont remis à zéro (ce panier ne peut pas être utilisé pour quitter l'île).",
    effects: [
      { type: EffectType.FOOD, value: 2 },
      { type: EffectType.WATER, value: 2 },
    ],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.FLASK,
    usage: "permanent",
    description:
      "Me permet de récupérer 2 fois plus d'eau à chaque fois que je collecte de l'eau. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).",
    effects: [{ type: EffectType.WATER }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.CRYSTAL_BALL,
    usage: "permanent",
    description:
      "Me permet de voter en dernier lors d'un vote. (Usage permanent, carte défaussée en cas d'élmination de son propriétaire).",
    effects: [{ type: EffectType.VOTE_MODIFIER }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.DUM_DUM_BULLET,
    usage: "unique",
    description:
      "A utiliser avec le revolver pour abattre un naufragé. Traverse les plaques de tôle et la plaque concave. (Usage unique)",
    effects: [{ type: EffectType.SHOOT }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.CONCAVE_PLATE,
    usage: "unique",
    description:
      "Si quelqu'un me tire dessus, la balle ricoche sur mon voisin de gauche.",
    effects: [{ type: EffectType.PROTECTION }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.AXE,
    usage: "permanent",
    description:
      "A chaque tour, me permet de récupérer 2 morceaux de bois sans risque si je choisis l'action 'Ramasser du bois'. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).",
    effects: [{ type: EffectType.WOOD, value: 2 }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.CLUB,
    usage: "permanent",
    description:
      "Donne 2 voix lors de chaque vote. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).",
    effects: [{ type: EffectType.VOTE_MODIFIER, value: 2 }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.LOTTERY_TICKET,
    usage: "unique",
    description:
      "Cet objet ne sert à rien (mais dire que vous auriez pu vous acheter un bateau avec...).",
    effects: [{ type: EffectType.NOTHING }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.VEGETABLE_GRINDER,
    usage: "unique",
    description:
      "Permet de transformer 2 rations de nourriture en 2 rations d'eau.",
    effects: [{ type: EffectType.WATER, value: 2 }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.SHAMAN_KIT,
    usage: "unique",
    description:
      "Si l'indicateur de pluie est à zéro pour ce tour, cette carte permet de la passer à 1.",
    effects: [{ type: EffectType.WEATHER, value: 1 }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.WHETSTONE,
    usage: "unique",
    description:
      "Associée à la hache, me permet de tuer un de mes voisins. La hache est défaussée après cet usage.",
    effects: [{ type: EffectType.SHOOT }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.CAT,
    usage: "unique",
    description: "En cas de pénurie uniquement, donne 2 rations de nourriture.",
    effects: [{ type: EffectType.FOOD, value: 2 }],
    image: "",
    isHidden: true,
  },
  {
    id: WreckageObjectList.TASER,
    usage: "unique",
    description:
      "Permet de voler une carte à effet permanent qui se trouve devant un autre joueur.",
    effects: [{ type: EffectType.STEAL_OBJECT }],
    image: "",
    isHidden: true,
  },
];

// Utility function to discard an object from a player
export const discardObjectFromPlayer = (
  gameState: GameState,
  playerId: string,
  objectId: string
): GameState => {
  const playerIndex = gameState.players.findIndex(
    player => player.id === playerId
  );
  if (playerIndex === -1) {
    throw new Error("Player not found");
  }

  const updatedPlayers = gameState.players.map((player, index) => {
    if (index === playerIndex) {
      return {
        ...player,
        objects: player.objects.filter(obj => obj.id !== objectId),
      };
    }
    return player;
  });

  return {
    ...gameState,
    players: updatedPlayers,
  };
};

export const handleUseObject = (
  gameState: GameState,
  playerId: string,
  objectId?: string,
  targetedPlayersId?: string[]
): GameState => {
  console.log(`Player ${playerId} used object ${objectId}`);

  // Find the object being used
  const object = allObjects.find(obj => obj.id === objectId);
  if (!object) {
    throw new Error("Object not found");
  }

  // Route to the specific object handler if available
  switch (object.id) {
    case WreckageObjectList.VEGETABLE_GRINDER:
      gameState = handleVegetableGrinder(gameState, playerId);
      break;
    case WreckageObjectList.SHAMAN_KIT:
      gameState = handleShamanKit(gameState, playerId);
      break;
    case WreckageObjectList.WHETSTONE:
      gameState = handleWhetstone(gameState, playerId);
      break;
    default:
      // Process generic effects for objects without specific handlers
      object.effects.forEach(effect => {
        switch (effect.type) {
          case EffectType.NOTHING:
            // No effect
            console.log(`Object ${objectId} has no effect.`);
            break;
          case EffectType.FOOD:
            gameState = handleFoodEffect(gameState, effect.value);
            break;
          case EffectType.WATER:
            gameState = handleWaterEffect(gameState, effect.value);
            break;
          case EffectType.PROTECTION:
            gameState = handleProtectionEffect(gameState, playerId);
            break;
          case EffectType.VOTE_MODIFIER:
            gameState = handleVoteModifierEffect(
              gameState,
              playerId,
              effect.value
            );
            break;
          case EffectType.STEAL_OBJECT:
            if (!targetedPlayersId?.length) {
              throw new Error(
                "Target player ID is required for stealing objects."
              );
            }
            gameState = handleStealObjectEffect(
              gameState,
              playerId,
              targetedPlayersId
            );
            break;
          case EffectType.SHOOT:
            if (!targetedPlayersId?.length) {
              throw new Error("Target player ID is required for shooting.");
            }
            gameState = handleShootEffect(
              gameState,
              playerId,
              targetedPlayersId
            );
            break;
          case EffectType.HEAL:
            gameState = handleHealEffect(gameState, playerId);
            break;
          case EffectType.SICKNESS:
            gameState = handleSicknessEffect(gameState, playerId);
            break;
          case EffectType.SEE_OBJECTS:
            gameState = handleSeeCardsEffect(gameState, playerId);
            break;
          case EffectType.WEATHER:
            gameState = handleWeatherEffect(gameState, effect.value);
            break;
          default:
            throw new Error("Effect not handled");
        }
      });
      break;
  }

  // Discard the object if it is a unique-use object
  if (object.usage === "unique") {
    gameState = discardObjectFromPlayer(gameState, playerId, object.id);
  }

  return gameState;
};
