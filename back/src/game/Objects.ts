export enum Effect {
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
  "SEE_CARDS" = "see_cards",
}

export type WreckageObject = {
  id: string;
  usage: "unique" | "permanent";
  description: string;
  effect: Effect;
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

export enum WreckageObjects {
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
    id: WreckageObjects.LUXURY_CAR_KEY,
    usage: "unique",
    description: "Cet objet ne sert à rien, même pas à faire le malin.",
    effect: Effect.NOTHING,
  },
  {
    id: WreckageObjects.BOARD_GAME,
    usage: "unique",
    description:
      "Cet objet (ne sert à rien) est génial (vous allez enfin pouvoir faire passer le temps de façon agréable).",
    effect: Effect.NOTHING,
  },
  {
    id: WreckageObjects.OLD_UNDERWEAR,
    usage: "unique",
    description:
      "Cet objet ne sert à rien, si ce n'est vous apporter un peu de réconfort.",
    effect: Effect.NOTHING,
  },
  {
    id: WreckageObjects.TIN_PLATE,
    usage: "unique",
    description: "Me protège d'un tir de revolver.",
    effect: Effect.PROTECTION,
  },
  {
    id: WreckageObjects.CANNIBAL_BBQ_KIT,
    usage: "unique",
    description:
      "A la fin d'un tour, ajoute 2 rations de nourriture pour chaque naufragé mort durant le tour.",
    effect: Effect.FOOD,
  },
  {
    id: WreckageObjects.VOODOO_DOLL,
    usage: "unique",
    description:
      "Permet de ressusciter un naufragé de mon choix au début d'un tour.",
    effect: Effect.HEAL,
  },
  {
    id: WreckageObjects.ANTIVENOM,
    usage: "unique",
    description:
      "Soigne une morsure de serpent. Je ne suis pas malade mais je perds le bois.",
    effect: Effect.HEAL,
  },
  {
    id: WreckageObjects.SLEEPING_PILL,
    usage: "unique",
    description: "Me permet de voler une carte au hasard à 3 naufragés.",
    effect: Effect.STEAL_OBJECT,
  },
  {
    id: WreckageObjects.REVOLVER,
    usage: "permanent",
    description:
      "Permet d'abattre un naufragé de mon choix lorsque j'ai une cartouche. (Usage permanent. Carte récupérée en cas d'élimination de son propriétaire).",
    effect: Effect.SHOOT,
  },
  {
    id: WreckageObjects.WATER_BOTTLE,
    usage: "unique",
    description: "Me permet de boire une ration d'eau.",
    effect: Effect.WATER,
  },
  {
    id: WreckageObjects.SANDWICH,
    usage: "unique",
    description: "Me permet de manger une ration de nourriture.",
    effect: Effect.FOOD,
  },
  {
    id: WreckageObjects.STALE_WATER,
    usage: "unique",
    description: "Equivalent à une ration d'eau mais rend malade pour 1 tour.",
    effect: Effect.SICKNESS,
  },
  {
    id: WreckageObjects.COCONUT,
    usage: "unique",
    description: "Me permet de manger une ration de nourriture.",
    effect: Effect.FOOD,
  },
  {
    id: WreckageObjects.BULLET,
    usage: "unique",
    description:
      "A utiliser avec le revolver pour abattre un naufragé. (Usage unique).",
    effect: Effect.SHOOT,
  },
  {
    id: WreckageObjects.SHELL,
    usage: "unique",
    description:
      "Durant ce tour, je suis le chef et personne ne peut voter contre moi. Cette carte peut être jouée avant ou après un vote.",
    effect: Effect.VOTE_MODIFIER,
  },
  {
    id: WreckageObjects.FLASHLIGHT,
    usage: "unique",
    description:
      "Permet de regarder les 3 premières cartes Épave du paquet et d'en choisir une. Les autres sont remises dans le paquet. Sans le montrer aux autres joueurs.",
    effect: Effect.SEE_CARDS,
  },
  {
    id: WreckageObjects.TELESCOPE,
    usage: "unique",
    description:
      "Avec cette longue-vue, je peux voir secrètement les cartes des autres naufragés.",
    effect: Effect.SEE_CARDS,
  },
  {
    id: WreckageObjects.BASKET,
    usage: "unique",
    description:
      "En cas de pénurie, aucun naufragé ne meurt de faim ou de soif, mais le(s) compteur(s) concerné(s) sont remis à zéro (ce panier ne peut pas être utilisé pour quitter l'île).",
    effect: Effect.NOTHING,
  },
  {
    id: WreckageObjects.FLASK,
    usage: "permanent",
    description:
      "Me permet de récupérer 2 fois plus d'eau à chaque fois que je collecte de l'eau. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).",
    effect: Effect.WATER,
  },
  {
    id: WreckageObjects.CRYSTAL_BALL,
    usage: "permanent",
    description:
      "Me permet de voter en dernier lors d'un vote. (Usage permanent, carte défaussée en cas d'élmination de son propriétaire).",
    effect: Effect.VOTE_MODIFIER,
  },
  {
    id: WreckageObjects.DUM_DUM_BULLET,
    usage: "unique",
    description:
      "A utiliser avec le revolver pour abattre un naufragé. Traverse les plaques de tôle et la plaque concave. (Usage unique)",
    effect: Effect.SHOOT,
  },
  {
    id: WreckageObjects.CONCAVE_PLATE,
    usage: "unique",
    description:
      "Si quelqu'un me tire dessus, la balle ricoche sur mon voisin de gauche.",
    effect: Effect.PROTECTION,
  },
  {
    id: WreckageObjects.AXE,
    usage: "permanent",
    description:
      "A chaque tour, me permet de récupérer 2 morceaux de bois sans risque si je choisis l'action 'Ramasser du bois'. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).",
    effect: Effect.WOOD,
  },
  {
    id: WreckageObjects.CLUB,
    usage: "permanent",
    description:
      "Donne 2 voix lors de chaque vote. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).",
    effect: Effect.VOTE_MODIFIER,
  },
  {
    id: WreckageObjects.LOTTERY_TICKET,
    usage: "unique",
    description:
      "Cet objet ne sert à rien (mais dire que vous auriez pu vous acheter un bateau avec...).",
    effect: Effect.NOTHING,
  },
  {
    id: WreckageObjects.VEGETABLE_GRINDER,
    usage: "unique",
    description:
      "Permet de transformer 2 rations de nourriture en 2 rations d'eau.",
    effect: Effect.WATER,
  },
  {
    id: WreckageObjects.SHAMAN_KIT,
    usage: "unique",
    description:
      "Si l'indicateur de pluie est à zéro pour ce tour, cette carte permet de la passer à 1.",
    effect: Effect.NOTHING,
  },
  {
    id: WreckageObjects.WHETSTONE,
    usage: "unique",
    description:
      "Associée à la hache, me permet de tuer un de mes voisins. La gache est défaussée après cet usage.",
    effect: Effect.SHOOT,
  },
  {
    id: WreckageObjects.CAT,
    usage: "unique",
    description: "En cas de pénurie uniquement, donne 2 rations de nourriture.",
    effect: Effect.FOOD,
  },
  {
    id: WreckageObjects.TASER,
    usage: "unique",
    description:
      "Permet de voler une carte à effet permanent qui se trouve devant un autre joueur.",
    effect: Effect.STEAL_OBJECT,
  },
];

export const discardObjectFromPlayer = (playerId: string, objectId: string) => {
  // TODO
};

export const handleUseObject = (
  io: any,
  gameId: string,
  playerId: string,
  objectId: WreckageObjects,
  targetPlayerId?: string
): void => {
  console.log(`Player ${playerId} used object ${objectId}`);
  switch (objectId) {
    // Clé de voiture de luxe : Cet objet ne sert à rien, même pas à faire le malin.
    case "luxury_car_key":
      // TODO
      break;
    // Jeu de société puissance 4 : Cet objet (ne sert à rien) est génial (vous allez enfin pouvoir faire passer le temps de façon agréable).
    case "board_game":
      // TODO
      break;
    // Vieux slip : Cet objet ne sert à rien, si ce n'est vous apporter un peu de réconfort.
    case "old_underwear":
      // TODO
      break;
    // Plaque de tôle : Me protège d'un tir de revolver.
    case "tin_plate":
      // TODO
      break;
    // Kit BBQ Cannibale : A la fin d'un tour, ajoute 2 rations de nourriture pour chaque naufragé mort durant le tour.
    case "cannibal_bbq_kit":
      // TODO
      break;
    // Poupée vaudou : Permet de ressusciter un naufragé de mon choix au début d'un tour.
    case "voodoo_doll":
      // TODO
      break;
    // Anti-venin : Soigne une morsure de serpent. Je ne suis pas malade mais je perds le bois.
    case "antivenom":
      // TODO
      break;
    // Somnifère : Me permet de voler une carte au hasard à 3 naufragés.
    case "sleeping_pill":
      // TODO
      break;
    // Revolver : Permet d'abattre un naufragé de mon choix lorsque j'ai une cartouche. (Usage permanent. Carte récupérée en cas d'élimination de son propriétaire).
    case "revolver":
      // TODO
      break;
    // Bouteille d'eau : Me permet de boire une ration d'eau.
    case "water_bottle":
      // TODO
      break;
    // Sandwich : Me permet de manger une ration de nourriture.
    case "sandwich":
      // TODO
      break;
    // Eau croupie : Equivalent à une ration d'eau mais rend malade pour 1 tour.
    case "stale_water":
      // TODO
      break;
    // Noix de coco : Me permet de manger une ration de nourriture.
    case "coconut":
      // TODO
      break;
    // Cartouche : A utiliser avec le revolver pour abattre un naufragé. (Usage unique).
    case "bullet":
      // TODO
      break;
    // Conque : Durant ce tour, je suis le chef et personne ne peut voter contre moi. Cette carte peut être jouée avant ou après un vote.
    case "shell":
      // TODO
      break;
    // Lampe torche : Permet de regarder les 3 premières cartes Épave du paquet et d'en choisir une. Les autres sont remises dans le paquet. Sans le montrer aux autres joueurs.
    case "flashlight":
      // TODO
      break;
    // Longue-vue : Avec cette longue-vue, je peux voir secrètement les cartes des autres naufragés.
    case "telescope":
      // TODO
      break;
    // Panier garni : En cas de pénurie, aucun naufragé ne meurt de faim ou de soif, mais le(s) compteur(s) concerné(s) sont remis à zéro (ce panier ne peut pas être utilisé pour quitter l'île).
    case "basket":
      // TODO
      break;
    // Gourde : Me permet de récupérer 2 fois plus d'eau à chaque fois que je collecte de l'eau. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).
    case "flask":
      // TODO
      break;
    // Boule de cristal : Me permet de voter en dernier lors d'un vote. (Usage permanent, carte défaussée en cas d'élmination de son propriétaire).
    case "crystal_ball":
      // TODO
      break;
    // Balle dum-dum : A utiliser avec le revolver pour abattre un naufragé. Traverse les plaques de tôle et la plaque concave. (Usage unique)
    case "dum_dum_bullet":
      // TODO
      break;
    // Plaque concave : Si quelqu'un me tire dessus, la balle ricoche sur mon voisin de gauche.
    case "concave_plate":
      // TODO
      break;
    // Hache : A chaque tour, me permet de récupérer 2 morceaux de bois sans risque si je choisis l'action "Ramasser du bois". (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).
    case "axe":
      // TODO
      break;
    // Gourdin : Donne 2 voix lors de chaque vote. (Usage permanent, carte défaussée en cas d'élimination de son propriétaire).
    case "club":
      // TODO
      break;
    // Ticket de loterie gagnant : Cet objet ne sert à rien (mais dire que vous auriez pu vous acheter un bateau avec...).
    case "lottery_ticket":
      // TODO
      break;
    // Moulin à légumes : Permet de transformer 2 rations de nourriture en 2 rations d'eau.
    case "vegetable_grinder":
      // TODO
      break;
    // Kit Chaman : Si la météo est à zéro pour ce tour, cette carte permet de la passer à 1.
    case "shaman_kit":
      // TODO
      break;
    // Pierre à aiguiser : Associée à la hache, me permet de tuer un de mes voisins. La gache est défaussée après cet usage.
    case "whetstone":
      // TODO
      break;
    // Chat : En cas de pénurie uniquement, donne 2 rations de nourriture.
    case "cat":
      // TODO
      break;
    // Taser : Permet de voler une carte à effet permanent qui se trouve devant un autre joueur.
    case "taser":
      // TODO
      break;
  }
};
