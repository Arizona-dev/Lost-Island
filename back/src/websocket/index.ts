// PRINCIPE ET BUT DU JEU
// Après le naufrage de leur bateau, un groupe de survivants se retrouve sur une île déserte. Le cadre est paradisiaque mais la vie est difficile.
// L’eau coule au gré des maigres précipitations et le poisson se fait rare. Il n’est pas certain que tout le monde survive à ce régime…
// Seule solution : construire ensemble un grand radeau. Mais il ne faut pas tarder car les nuages à l’horizon indiquent l’arrivée prochaine d’un dangereux ouragan.
// À la fin de la partie, le ou les joueurs qui parviennent à quitter l’île à temps gagnent, à moins que personne n’ait survécu, bien sûr !

// Détail d'un tour de jeu
// 1. Changement du premier joueur
// (cette phase est ignorée lors du premier tour)
// A chaque fois que le tour de jeu revient au premier joueur, la carte Premier joueur passe au joueur situé à sa droite.
// 2. Tirer la carte Météo
// A chaque nouveau tour, le premier joueur retourne la première carte Météo de la pile.
// 3. Action des joueurs
// Dans l'ordre du jeu en commençant par le joueur qui détient la carte Premier joueur, chacun choisit l'action qu'il souhaite réaliser parmi les quatres possibles.
// Pêcher, Collecter de l'eau, Collecter du bois pour construire le radeau, Fouiller l'épave.
// 4. Survie des naufragés
// Lorsque tous les joueurs ont effectué leur action, chaque survivant doit consommer une unité de nourriture et une unité d'eau. (joueurs encore en jeu, y compris les malades).
// A. Décompte Eau
// S'il y a au moins autant de ration d'eau que de joueurs encore en jeu, chaque joueur boit une ration d'eau.
// S'il y a moins d'eau que de survivants, les joueurs peuvent utiliser des cartes Eau pour ajouter une ou plusieurs rations au compteur. Si cela ne suffit pas, un vote est organisé pour savoir qui sera privé d'eau. A la fin du vote, il ne pourra rester en jeu qu'un nombre de joueur égal au nombre de rations d'eau disponibles. Les autres sont tragiquement morts de soif et quittent la partie.
// B. Décompte Nourriture
// Une fois que les rations d’eau ont été distribuées, les joueurs passent au décompte de la nourriture.
// S’il y a au moins autant de rations de nourriture disponibles que de survivants, une ration est retranchée pour chaque survivant et le tour prend fin.
// S’il y a moins de rations de nourriture disponibles que de survivants, les joueurs peuvent utiliser des cartes Nourriture pour ajouter une ou plusieurs rations au compteur. Si cela ne suffit pas, un vote est organisé pour savoir qui sera privé de nourriture. À la fin du vote, il ne pourra rester en jeu qu’un nombre de joueurs égal au nombre de rations de nourriture disponibles. Les autres sont tragiquement morts de faim et quittent la partie...
// NB : si un compteur de ressource est à zéro au début de cette phase, il n’y a pas de vote. Les naufragés possédant une carte de cette ressource survivent, les autres meurent à moins qu’un autre naufragé ne les aide ou qu’ils utilisent le revolver à bon escient.
// 5. Fin du tour
// Après avoir procédé aux votes éventuels et réajusté les compteurs en fonction des rations utilisées, les joueurs survivants entament un nouveau tour. La carte Premier joueur passe à la droite du joueur qui la détient, ou on procède à la fin de partie.

// DÉTAIL DES ACTIONS
// 1. Pêcher
// La pêche artisanale sur cette île est très aléatoire. Le joueur qui choisit d’effectuer cette action pioche une boule dans le sac. Le nombre de poisson(s) sur la boule (1, 2, 3) indique la valeur de la pêche. Le niveau de Nourriture est augmenté d’autant de nombre. La boule est ensuite remise dans le sac.
// 2. Collecter de l’eau
// Le joueur qui choisit d’effectuer cette action regarde le nombre inscrit dans la goutte sur la carte Météo du tour (entre 0 et 3) et avance le marqueur Eau (Goutte) d’autant de case(s) sur le compteur de vivres du plateau. Attention, il n’est pas possible de récupérer de l’eau un jour de grand soleil (goutte marquée 0) : soyez prévoyant ! Exemple : à son tour, Marie décide d’aller chercher de l’eau, elle regarde le nombre indiqué sur la carte Météo du tour, en l’occurrence 2 et avance donc le pion Goutte de 2 cases sur le compteur de vivres. Dans le cas des actions 1 et 2 la limite de réserve de vivres est de 36 : les survivants ne peuvent stocker plus (et oui, l’eau et la nourriture sont périssables).
// 3. Collecter du bois pour construire le radeau
// Pour trouver du bois, le naufragé se rend dans la forêt, malheureusement infestée de serpents ! Le premier morceau de bois est récupéré sans risque en lisière de forêt.
// Le joueur qui choisit d’effectuer cette action avance donc automatiquement le disque Bois d’une étape sur la piste radeau.
// Exemple : Adrien décide à son tour d’aller chercher du bois, il commence par avancer le disque Bois d’une étape. Le joueur peut ensuite décider d’en ramener plus et s’enfoncer dans la forêt à ses risques et périls. Il annonce alors combien de morceaux de bois supplémentaires il souhaite ramasser (entre 1 et 5) et pioche au hasard et simultanément autant de boules dans le sac. Si toutes les boules sont blanches, le joueur avance le disque d’autant de cases que de boules piochées.
// Exemple (suite) : Adrien souhaite aller plus loin et décide de piocher 2 boules supplémentaires. Comme elles sont blanches, il avance le disque Bois de 2 étapes sur la piste Radeau.
// Si le joueur pioche la boule noire, le naufragé est mordu par un serpent et tombe malade pour un tour (voir Maladie p.12). Il n’avance le disque Bois d’aucune case supplémentaire.
// Exemple : Benoit souhaite lui aussi effectuer l’action « Ramasser du bois ». Il commence par avancer le disque Bois d’une case sur la piste Radeau puis décide de piocher 3 boules supplémentaires. Malheureusement il pioche la boule Noire. Il n’avance donc pas le disque et prend une carte État du naufragé qu’il place devant lui, face Serpent visible.
// Puis les boules sont remises dans le sac.
// Le disque Bois va circuler autour de la piste Radeau (de 0 à 6). Dès qu’il atteint la sixième case, on ajoute une carte Radeau sur l’emplacement des cartes Place de radeau du plateau et le disque retourne à la case zéro. Chaque carte Radeau correspond à une place sur le radeau pour quitter l’île.
// 4. Fouiller l’épave
// Le joueur pioche la première carte Épave dans la cale du bateau et l’ajoute à sa main de cartes sans la montrer aux autres joueurs.

// JOUER UNE CARTE
// Les cartes Épave détenues par les naufragés peuvent être (sauf indication contraire) jouées à tout moment. Hormis les cartes à effet permanent, elles sont défaussées après usage. Les cartes peuvent aussi servir à des échanges ou des promesses (pas toujours tenues) entre les joueurs.

// LES CARTES ÉPAVE
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

// Types de cartes
// Cartes ressources : eau, nourriture. Elles peuvent être jouées pour le bien de la communauté et donc ajouter des points au compteur de vivre ou à titre individuel en cas de pénurie. Il est tout à fait possible de les donner à un autre joueur.

// Cartes spéciales à usage unique : anti-venin, poupée vaudou, etc. Ces cartes permettent d’effectuer une action spécifique et sont défaussées après usage (sauf mention contraire sur la carte).

// Cartes à effet permanent : hache, gourde, canne à pêche, gourdin, boule de cristal, etc. Quand un joueur souhaite utiliser ces cartes, il les place faces visibles devant lui. Elles peuvent lui servir à chaque tour. Si le joueur meurt, ses cartes à effet permanent ayant été utilisées sont défaussées (sauf exception pour le Revolver).

// Cartes inutiles : vieux slip, clé de voiture, etc. Ces cartes sont sans effet. Mais elles peuvent être échangées avec un autre joueur pour le rouler par exemple.

// LES VOTES
// Les votes sont nécessaires en cas de pénurie d’eau ou de nourriture (ou si les joueurs doivent quitter l’île mais n’ont pas assez de place sur le radeau). Tous les joueurs placent leurs votent contre un autre joueur en le désignant. Celui qui recueille le plus de votes contre lui est sacrifié.
// Les joueurs peuvent débattre avant le vote pour décider de leur stratégie. C’est le premier joueur qui décide quand mettre fin au débat.

// Un joueur désigné par un vote en cas de pénurie peut sauver sa peau en jouant une carte de la ressource manquante. Dans ce cas le naufragé survit et il n’y a pas besoin de reprendre ce vote. Il peut également tirer sur un autre joueur. Si ce dernier meurt, il y a une bouche de moins à nourrir et donc le résultat du vote est annulé.

// En cas d’égalité entre plusieurs naufragés, le joueur qui possède la carte Premier joueur décide lequel est sacrifié et ce, qu’il soit inclus dans l’égalité ou non.
// Exemple : lors d’un vote entre 7 naufragés, Benoit et David recueillent chacun 3 voix contre eux.
// C’est Pierre qui détient la carte Premier joueur, il décide d’éliminer Benoit qui avait voté contre lui. La vengeance est un plat qui se mange froid !
// Chaque vote ne désigne qu’un seul joueur. S’il faut en sacrifier d’autres, d’autres votes sont organisés.

// MORT DE SOIF OU DE FAIM
// Suite à une pénurie, les naufragés désignés par un vote meurent de soif ou de faim, sauf s’ils peuvent se défausser d’une carte Eau ou Nourriture. Un naufragé qui se sauve d’un vote de cette façon ne peut pas être désigné une seconde fois pour la même ressource lors du même tour. Par contre il peut être désigné pour une autre ressource.
// Exemple : Pierre est désigné par les votes suite à une pénurie d’eau.
// Heureusement il possède une carte Bouteille d’eau qui lui assure une ration d’eau personnelle. Malheureusement il y a aussi une pénurie de nourriture et les joueurs désignent à nouveau Pierre. Comme il ne possède pas de ration de nourriture, il meurt de faim et quitte la partie. Un naufragé peut également être sauvé par un autre joueur qui peut lui offrir une ration d’Eau ou de Nourriture.
// Un naufragé mort de soif ou de faim quitte la partie : il place devant lui une carte État du naufragé, face Tombe visible. Les cartes qu’il a en main sont mélangées puis réparties alternativement et aléatoirement entre son voisin de gauche et de droite en commençant par son voisin de gauche. Les cartes à usage permanent qui sont posées devant lui sont défaussées (sauf le Revolver qui est récupéré).

// MALADIES
// Un joueur peut être malade suite à la morsure d’un serpent (Action « ramasser du bois ») ou à l’utilisation des cartes Eau croupie et Poisson pourri. Le joueur prend alors une carte État du naufragé et la place face Serpent visible devant lui. Il ne pourra pas voter à la fin du tour (mais pourra bien sûr être sacrifié) et ne pourra faire aucune action ni jouer aucune carte au tour suivant. Par contre, il pourra participer à la phase de vote du tour suivant. Il retire la carte État du naufragé avant la phase 4 (survie des naufragés).
// Attention : en cas de vote contre lui, le joueur malade peut néanmoins jouer une carte Eau ou Nourriture pour survivre.
// Exemple : Benoit va chercher du bois mais, pas de chance, il se fait mordre par un serpent. Le tour se termine et on passe au décompte. Il y a assez d’eau pour tout le monde, mais pas assez de nourriture. Un vote est donc nécessaire. Benoit ne pourra pas voter car il est malade. Tout le monde vote d’ailleurs contre lui, mais heureusement il a une carte Sandwich et sauve sa peau. Un nouveau tour commence et quand vient le sien il ne peut pas faire d’action. À la fin du tour avant le décompte des vivres, Benoit défausse sa carte État du naufragé.

// FIN DE PARTIE
// La partie prend fin de trois façons :
// 1. Quitter l’île
// À la fin de n’importe quel tour, tous les joueurs survivants peuvent embarquer sur le radeau. Pour pouvoir embarquer il faut respecter les conditions suivantes :
// • Les rations d’eau et de nourriture ont été distribuées.
// • Il y a au moins autant de places sur le radeau que de survivants. C’est-à-dire qu’il y a, sur le plateau, au moins autant de cartes Radeau que de survivants.
// • Il y a une ration d’eau et de nourriture supplémentaire par joueur survivant (pour le voyage).
// Exemple : il reste 4 joueurs à la fin du tour, le compteur de vivre indique 8 en Eau et 9 en Nourriture. Les joueurs procèdent à la distribution de nourriture, les compteurs passent donc à 4 en Eau et 5 en Nourriture. Il y a 4 cartes Radeau sur l’emplacement des cartes Radeau sur le plateau. Les 4 joueurs peuvent donc embarquer et gagnent la partie (il est possible que tous les joueurs parviennent à embarquer et gagnent).

// 2. Arrivée de l'ouragan
// Dès que la carte Météo Ouragan (sablier barré) est retournée, le radeau doit quitter l’île à la fin du tour, sinon tous les joueurs perdent ! Pour pouvoir embarquer il faut :
// • que les rations d’Eau et de Nourriture aient été distribuées.
// • avoir autant de cartes Radeau sur le plateau que de joueurs survivants. Sinon il faut procéder à un vote pour en sacrifier.
// • enfin iI doit y avoir une ration d’eau et de nourriture supplémentaire par joueur embarqué (s’il n’y en a pas assez, procéder comme d’habitude à un vote pour désigner les joueurs sacrifiés).
// Attention : il est interdit d’utiliser la carte Panier garni comme ration supplémentaire pour embarquer.
// Les joueurs éliminés par ces votes doivent donner les cartes qu’ils ont en main à leurs voisins, comme pour les autres votes.
// Les joueurs qui parviennent à embarquer sur le radeau gagnent la partie.
// NB : il est possible d’embarquer dans le radeau en étant malade (on peut donc par exemple manger du Poisson pourri ou boire de l’eau croupie pour embarquer).

// 3. Hécatombe
// La partie peut également prendre fin si tous les joueurs meurent de soif ou de faim à la fin d’un tour. Dans ce cas tous les joueurs ont perdu !

// RECAPITULATIF D'UN TOUR DE JEU
// 1. Changement du premier joueur
// 2. Tirer la carte Météo
// 3. Action des joueurs
// Chaque joueur choisit d’effectuer l’une de ces 4 actions :
// Pêcher du poisson :
// Piocher une boule dans le sac et déplacer le pion Nourriture du nombre de poisson(s) indiqué (1 à 3).
// Collecter de l’eau :
// Déplacer le pion d’eau sur le compteur de vivre du nombre de cases indiqué sur la carte Météo du tour (0 à 3).
// Collecter du bois et construire le radeau :
// Avancer le disque Bois d’une étape puis décider de piocher une ou plusieurs boules supplémentaires dans le sac. Si la boule noire n’apparait pas, avancer d’autant d’étapes que de boules blanches piochées. Si le disque atteint l’étape 6, ajouter une carte Place de radeau sur le plateau.
// Fouiller l’épave Piochez une carte Épave et ajoutez-la à votre main.

// 4. Survie des naufragés
// A. Décompte Eau
// B. Décompte Nourriture
// 5. Fin du tour

// CONTENU DU JEU ET MISE EN PLACE
// Mettre les 6 boules en bois dans le sac.
// Créer une pile avec les 12 cartes Radeau et la placer à proximité du plateau de jeu.
// Mélanger les 54 cartes Épave puis distribuer:
// • Pour une partie de 3 à 8 joueurs, chacun reçoit 4 cartes Épave au hasard.
// • Pour une partie de 9 à 12 joueurs, chacun en reçoit 3.
// Le reste des cartes Épave est placé faces cachées dans le porte-cartes.

// On retire 5 cartes Météo choisies au hasard parmi les 12 cartes Météo du jeu ainsi que la carte Ouragan (avec un sablier barré).
// Ces 6 cartes sont mélangées puis placées en bas du paquet de cartes Météo qui est placé face cachée sur le plateau.
// Le disque en bois est placé sur la case zéro de la piste Radeau.
// Les pions Eau et Nourriture sont placés sur le compteur de vivres en fonction du nombre de joueurs :
// Nombre de joueurs | Nourriture | Eau
// 3 | 5 | 6
// 4 | 7 | 8
// 5 | 8 | 10
// 6 | 10 | 12
// 7 | 12 | 14
// 8 | 13 | 16
// 9 | 15 | 18
// 10 | 16 | 20
// 11 | 18 | 22
// 12 | 20 | 24

// Déposez les 12 cartes État du naufragé en une pile à côté du plateau.
// Le premier joueur est choisi au hasard et reçoit la carte Premier joueur.
// Le jeu est prêt à commencer.

import { Server } from "socket.io";
import { Express } from "express";
import { GameEvents } from "../game/Events";
import {
  GameStatus,
  createGameState,
  getGameState,
  isPlayerInGame,
  joinGame,
  setGameState,
  startGame,
} from "../game/Game";
import { handlePlayerAction } from "../game/Player";
import { joinGameService } from "../services/gameService";

export const initializeWebSocket = (app: Express, server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", socket => {
    console.log(`[WS]: Connecté: ${socket.id}`);

    socket.on("getOnlinePlayers", () => {
      const onlinePlayers = io.engine.clientsCount;
      console.log(`Nombre de joueurs en ligne: ${onlinePlayers}`);
      io.emit("onlinePlayers", onlinePlayers);
    });

    socket.on("FETCH_GAME_STATE", async ({ gameId }) => {
      const gameState = await getGameState(gameId);
      if (!gameState) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de trouver la partie",
        });
      }
      console.log(`[WS]: Envoi de l'état du jeu ${gameId}`);
      io.to(socket.id).emit(GameEvents.UPDATE_GAME_STATE, gameState);
    });

    socket.on(
      GameEvents.JOIN_GAME,
      async ({ gameId, playerId, playerName }) => {
        console.log(`[WS]: ${playerName} a rejoint le jeu ${gameId}`);
        socket.join(gameId);

        let gameState = await getGameState(gameId);

        if (!gameState) {
          gameState = await createGameState(gameId);
        }
        if (!isPlayerInGame(gameState, playerId)) {
          if (gameState.status === GameStatus.STARTED) {
            return io.to(socket.id).emit("error", {
              message:
                "Impossible de rejoindre le jeu: la partie a déjà commencé",
            });
          }
          gameState = await joinGame(gameId, {
            id: playerId,
            name: playerName,
            status: "normal",
            voteCount: 1,
            objects: [],
          });
        }
        await joinGameService(gameId, {
          id: playerId,
          name: playerName,
          status: "normal",
          voteCount: 1,
          objects: [],
        });
        io.to(gameId).emit(GameEvents.UPDATE_GAME_STATE, gameState);
        io.to(gameId).emit(GameEvents.PLAYER_JOINED, {
          playerId,
          playerName,
        });
      }
    );

    socket.on(GameEvents.LEAVE_GAME, async ({ gameId, playerId }) => {
      console.log(`[WS]: ${playerId} a quitté le jeu ${gameId}`);
      const gameState = await getGameState(gameId);
      if (!gameState) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de trouver la partie",
        });
      }
      if (gameState.status === GameStatus.STARTED) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de quitter le jeu: la partie a déjà commencé",
        });
      }
      if (isPlayerInGame(gameState, playerId)) {
        gameState.players = gameState.players.filter(
          (p: any) => p.id !== playerId
        );
        await setGameState(gameId, gameState);
        io.to(gameId).emit(GameEvents.UPDATE_GAME_STATE, gameState);
        io.to(gameId).emit(GameEvents.PLAYER_LEFT, { playerId });
      }
    });

    socket.on("RESET_GAME", async ({ gameId }) => {
      console.log(`[WS]: Réinitialisation du jeu ${gameId}`);
      const gameState = await createGameState(gameId);
      await setGameState(gameId, gameState);
      io.to(gameId).emit(GameEvents.UPDATE_GAME_STATE, gameState);
    });

    socket.on(GameEvents.GAME_STARTED, async ({ gameId }) => {
      let gameState = await getGameState(gameId);
      if (!gameState) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de démarrer la partie: la partie existe déjà",
        });
      }
      gameState = await startGame(gameState);
      console.log(`[WS]: Lancement de la partie ${gameId}`);
      io.to(gameId).emit(GameEvents.GAME_STARTED, gameState);
    });

    socket.on(
      GameEvents.PLAYER_ACTION,
      async ({ gameId, playerId, action }) => {
        const gameState = await getGameState(gameId);
        if (!gameState) {
          return io.to(socket.id).emit("error", {
            message: "Impossible de trouver la partie",
          });
        }

        if (gameState.playerIdTurn !== playerId) {
          return io.to(socket.id).emit("error", {
            message: "Ce n'est pas votre tour",
          });
        }

        // Gérer l'action du joueur
        console.log(
          `[WS]: Action reçue de ${playerId} dans le jeu ${gameId}: `,
          action
        );
        await handlePlayerAction(io, gameId, playerId, action);

        // Passer au joueur suivant
        const playerIndex = gameState.players.findIndex(
          (p: any) => p.id === playerId
        );
        const nextPlayerIndex = (playerIndex + 1) % gameState.players.length;
        gameState.playerIdTurn = gameState.players[nextPlayerIndex].id;
        await setGameState(gameId, gameState);

        // Notifier le joueur suivant
        io.to(gameState.playerIdTurn).emit(GameEvents.YOUR_TURN);
        io.to(gameId).emit(GameEvents.ACTION_PROCESSED, { playerId, action });
      }
    );

    socket.on(GameEvents.VOTE, async ({ gameId, playerId, targetPlayerId }) => {
      const gameState = await getGameState(gameId);
      if (!gameState) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de trouver la partie",
        });
      }

      if (!gameState.isVotingActive) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de voter: pas de vote en cours",
        });
      }

      if (!isPlayerInGame(gameState, targetPlayerId)) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de voter pour un joueur inexistant",
        });
      }

      const player = gameState.players.find((p: any) => p.id === playerId);
      if (!player) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de trouver le joueur",
        });
      }

      if ((player.voteCount = 0)) {
        return io.to(socket.id).emit("error", {
          message: "Impossible de voter: vous avez déjà voté",
        });
      }

      player.voteCount = 0;
      await setGameState(gameId, gameState);

      io.to(gameId).emit(GameEvents.VOTE, { playerId, targetPlayerId });
    });

    // Gestion de la déconnexion d'un client (joueur)
    socket.on("disconnect", () => {
      console.log(`Client déconnecté: ${socket.id}`);
      const onlinePlayers = io.engine.clientsCount;
      io.emit("onlinePlayers", onlinePlayers);
    });
  });

  return io;
};
