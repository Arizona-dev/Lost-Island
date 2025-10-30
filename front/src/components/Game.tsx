import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import socket from "../socket";
import { Actions, GameState, Player, GameEvents } from "../types";
import type { Game } from "../types";
import { getGame } from "../services/gameService";

const Game = () => {
  const gameCode = window.location.pathname.split("/").pop();
  const navigate = useNavigate();
  const location = useLocation();
  const [gameSettings, setGameSettings] = useState<Game | null>(null);
  const [gameData, setGameData] = useState<GameState | null>(null);
  const [showEndScreen, setShowEndScreen] = useState(true);
  const [shouldNavigateToLobby, setShouldNavigateToLobby] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  enum weatherList {
    "Rainy" = "🌧️ Pluvieux",
    "Sunny" = "☀️ Ensoleillé",
    "Stormy" = "🌩️ Orageux",
    "Hurricane" = "🌀 Ouragan",
  }

  // Monitor route changes to prevent showing game end screen after navigation
  useEffect(() => {
    if (!location.pathname.startsWith("/game/")) {
      setShowEndScreen(false);
      setShouldNavigateToLobby(false);
      setIsNavigating(false);
    }
  }, [location.pathname]);

  // Handle navigation to lobby when shouldNavigateToLobby is true
  useEffect(() => {
    if (shouldNavigateToLobby && !isNavigating) {
      setIsNavigating(true);

      // Clean up only game-specific listeners but keep socket connection alive
      socket.off("connect");
      socket.off("GAME_STARTED");
      socket.off("UPDATE_GAME_STATE");
      socket.off("PLAYER_LEFT");
      socket.off(GameEvents.GAME_ENDED);
      socket.off(GameEvents.GAME_RESET_TO_LOBBY);

      // Clear all state to prevent any re-rendering
      setShowEndScreen(false);
      setGameSettings(null);
      setGameData(null);

      // Force navigation with a delay to ensure cleanup
      setTimeout(() => {
        if (gameCode) {
          window.location.replace(`/join/${gameCode}`);
        } else {
          window.location.replace("/lobby");
        }
      }, 200);
    }
  }, [shouldNavigateToLobby, gameCode, isNavigating]);

  useEffect(() => {
    document.title = "Partie en cours";
    const fetchGame = async () => {
      try {
        if (!gameCode) {
          return;
        }
        const gameResponse = await getGame(gameCode);
        setGameSettings(gameResponse);

        socket.emit("FETCH_GAME_STATE", { gameId: gameResponse._id });

        socket.emit("JOIN_GAME", {
          gameId: gameResponse._id,
          playerId: localStorage.getItem("playerId"),
          playerName: localStorage.getItem("playerName"),
        });
      } catch (error) {
        console.log(error);
      }
    };

    fetchGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      if (!gameData?.id) {
        return;
      }
      socket.emit("JOIN_GAME", {
        gameId: gameData.id,
        playerId: localStorage.getItem("playerId"),
        playerName: localStorage.getItem("playerName"),
      });
    });

    socket.on("error", (error) => {
      console.error(error);
    });

    socket.on("GAME_STARTED", (gameState) => {
      console.log("GAME_STARTED reçu du serveur", gameState);
      setGameData(gameState);
      // TODO : Afficher un message de confirmation
    });

    socket.on("UPDATE_GAME_STATE", (newState) => {
      console.log("UPDATE_GAME_STATE reçu du serveur", newState);

      // Don't update state if we're not on the game route anymore
      if (!window.location.pathname.startsWith("/game/")) {
        return;
      }

      // Vérifier si le joueur actuel est toujours dans la partie AVANT de mettre à jour l'état
      const currentPlayerId = localStorage.getItem("playerId");
      const isPlayerStillInGame = newState.players?.some(
        (player: Player) => player.id === currentPlayerId
      );

      // Mettre à jour l'état avec le nouveau state complet (pas de merge)
      setGameData(newState);

      // Si le joueur n'est plus dans la partie, rediriger vers le lobby
      if (!isPlayerStillInGame && currentPlayerId) {
        navigate("/lobby");
      }
    });

    socket.on("PLAYER_LEFT", ({ playerId }) => {
      // Don't handle if we're not on the game route anymore
      if (!window.location.pathname.startsWith("/game/")) {
        return;
      }

      const currentPlayerId = localStorage.getItem("playerId");
      // Si c'est le joueur actuel qui a quitté, rediriger vers le lobby
      if (playerId === currentPlayerId) {
        navigate("/lobby");
      }
    });

    socket.on(GameEvents.GAME_ENDED, (gameState) => {
      console.log("GAME_ENDED reçu du serveur", gameState);

      // Don't update state if we're not on the game route anymore
      if (!window.location.pathname.startsWith("/game/")) {
        return;
      }

      setGameData(gameState);
    });

    socket.on(GameEvents.GAME_RESET_TO_LOBBY, () => {
      console.log("GAME_RESET_TO_LOBBY reçu, redirection vers le lobby");
      // Only redirect if we're still on the game route
      if (window.location.pathname.startsWith("/game/")) {
        if (gameCode) {
          window.location.href = `/join/${gameCode}`;
        } else {
          window.location.href = "/lobby";
        }
      }
    });

    return () => {
      // Only clean up if not navigating away
      if (!shouldNavigateToLobby) {
        socket.off("connect");
        socket.off("GAME_STARTED");
        socket.off("UPDATE_GAME_STATE");
        socket.off("PLAYER_LEFT");
        socket.off(GameEvents.GAME_ENDED);
        socket.off(GameEvents.GAME_RESET_TO_LOBBY);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionsDisabled = () => {
    const currentPlayerId = localStorage.getItem("playerId");
    const currentPlayer = gameData?.players?.find(p => p.id === currentPlayerId);
    const isPlayerSick = currentPlayer?.status === "sick";
    const isPlayerDead = currentPlayer?.status === "dead";

    // Les actions sont désactivées si :
    // - Le joueur est mort
    // - Ce n'est pas le tour du joueur OU un vote est actif
    // - OU le joueur est malade
    return (
      isPlayerDead ||
      gameData?.playerIdTurn !== currentPlayerId ||
      gameData?.isVotingActive ||
      isPlayerSick
    );
  };

  const canUseObjects = () => {
    const currentPlayerId = localStorage.getItem("playerId");
    const currentPlayer = gameData?.players?.find(p => p.id === currentPlayerId);
    const isPlayerSick = currentPlayer?.status === "sick";
    const isPlayerDead = currentPlayer?.status === "dead";

    // Les objets peuvent être utilisés :
    // - À tout moment sauf si le joueur est mort ou malade (sauf pendant un vote)
    return (!isPlayerDead && !isPlayerSick) || gameData?.isVotingActive;
  };

  // Calculate remaining vote time
  const getRemainingVoteTime = (): number => {
    if (!gameData?.isVotingActive || !gameData?.voteStartTime || !gameData?.voteDuration) {
      return 0;
    }
    const elapsed = (Date.now() - gameData.voteStartTime) / 1000; // seconds
    const remaining = Math.max(0, gameData.voteDuration - elapsed);
    return Math.ceil(remaining);
  };

  const [remainingTime, setRemainingTime] = useState(getRemainingVoteTime());

  useEffect(() => {
    if (gameData?.isVotingActive && gameData?.voteStartTime && gameData?.voteDuration) {
      const updateRemainingTime = () => {
        const remaining = getRemainingVoteTime();
        setRemainingTime(remaining);
        return remaining;
      };

      // Update immediately
      updateRemainingTime();

      const interval = setInterval(() => {
        const remaining = updateRemainingTime();
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 100); // Update every 100ms for smooth countdown

      return () => clearInterval(interval);
    } else {
      setRemainingTime(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameData?.isVotingActive, gameData?.voteStartTime, gameData?.voteDuration]);

  if (!gameSettings || !gameData) {
    return <div>Chargement...</div>;
  }

  // If we're navigating away or have navigated, don't render anything
  if (shouldNavigateToLobby || isNavigating) {
    return null;
  }

  // Early return if we're not on the game route anymore
  // This prevents showing game end screen after navigation
  if (!location.pathname.startsWith("/game/")) {
    return null;
  }

  const currentPlayerId = localStorage.getItem("playerId");
  const currentPlayer = gameData?.players?.find(p => p.id === currentPlayerId);
  const isPlayerDead = currentPlayer?.status === "dead";
  const isGameEnded = gameData?.status === "ended";

  // Calculate statistics
  const alivePlayers = gameData?.players?.filter(p => p.status !== "dead") || [];
  const deadPlayers = gameData?.players?.filter(p => p.status === "dead") || [];
  const totalPlayers = gameData?.players?.length || 0;
  const finalDay = gameData?.day || 1;

  // Show game end screen only if game is ended AND showEndScreen is true
  if (isGameEnded && showEndScreen) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <img
          src="/assets/island_1.webp"
          alt="ile"
          className="w-full h-full object-cover -z-10 absolute top-0 left-0 filter blur-sm opacity-80"
        />
        <div className="bg-gray-900 bg-opacity-95 rounded-lg p-8 max-w-4xl w-full mx-4 z-10 border-4 border-red-600">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-4xl font-bold text-red-500 mb-4">💀 Partie terminée</h1>
            <p className="text-xl text-gray-200 mb-6">
              Tous les survivants sont morts après {finalDay} jour{finalDay > 1 ? "s" : ""}
            </p>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800 bg-opacity-60 rounded-lg p-4">
                <h2 className="text-2xl font-bold text-white mb-4">📊 Statistiques</h2>
                <div className="space-y-2 text-gray-200">
                  <div className="flex justify-between">
                    <span>Joueurs totaux :</span>
                    <span className="font-bold">{totalPlayers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Survivants :</span>
                    <span className="font-bold text-green-400">{alivePlayers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Morts :</span>
                    <span className="font-bold text-red-400">{deadPlayers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jour final :</span>
                    <span className="font-bold">{finalDay}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-60 rounded-lg p-4">
                <h2 className="text-2xl font-bold text-white mb-4">👥 Joueurs</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gameData?.players?.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded ${player.status === "dead" ? "bg-red-900 bg-opacity-30" : "bg-green-900 bg-opacity-30"
                        }`}
                    >
                      <span className="text-gray-200">{player.name || "Joueur sans nom"}</span>
                      <span className="text-2xl">
                        {player.status === "dead" ? "💀" : player.status === "sick" ? "🤒" : "😀"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full items-center">
              <button
                onClick={() => {
                  // Immediately hide the end screen and trigger navigation
                  setShowEndScreen(false);
                  setShouldNavigateToLobby(true);
                }}
                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all flex items-center gap-2"
              >
                <span>🏠</span>
                <span>Retour au lobby</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      <img
        src="/assets/island_1.webp"
        alt="ile"
        className="w-full h-full object-cover -z-10 absolute top-0 left-0 filter blur-sm opacity-80"
      />
      {isPlayerDead && (
        <div className="w-full bg-red-900 bg-opacity-95 border-b-4 border-red-600 p-4 z-50">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">💀</span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-red-100">Vous êtes mort</span>
              <span className="text-red-200">Vous pouvez observer la partie mais ne pouvez plus jouer</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex w-full h-full">
        <div className="flex flex-col justify-between p-6 w-6/12 gap-6">
          <div className="flex flex-col w-full bg-gray-950 bg-opacity-40 rounded-lg p-4 gap-2 min-w-60">
            <h2 className="text-xl font-bold">🐚 Naufragés</h2>
            <div className="flex flex-wrap gap-4">
              {gameData?.players
                ?.filter(
                  (player) => player.id !== localStorage.getItem("playerId")
                )
                ?.filter((player, index, self) =>
                  index === self.findIndex((p) => p.id === player.id)
                )
                ?.map((player) => (
                  <div
                    {...(gameData.isVotingActive
                      ? {
                        onClick: () =>
                          socket.emit("VOTE", {
                            gameId: gameData.id,
                            playerId: localStorage.getItem("playerId"),
                            targetPlayerId: player.id,
                          }),
                      }
                      : {})}
                    key={player.id + "player"}
                    className="flex flex-col items-center space-y-4"
                  >
                    <div className="flex items-center space-x-4 bg-gray-950 bg-opacity-30 rounded-lg p-2 w-full">
                      <div className="h-12 w-12 bg-gray-950 bg-opacity-30 rounded-full">
                        <img
                          src={`https://i.pravatar.cc/150?u=${player.id}`}
                          alt={player.name}
                          className="h-12 w-12 rounded-full"
                        />
                      </div>
                      <div className="flex flex-col items-start">
                        <span>{player.name || "Joueur sans nom"}</span>
                        <span>
                          {player.status === "dead"
                            ? "💀"
                            : player.status === "sick"
                              ? "🤒"
                              : "😀"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      {player.objects.map((object) => (
                        <div
                          key={object.id + player.id}
                          className="flex flex-col items-center space-y-2"
                        >
                          <img
                            // src={`/assets/${object.image}`}
                            src="https://www.gigamic-adds.com/images/games/hellapagos/cartes-extension/objets/bouee.jpg"
                            alt={object.description}
                            className="rounded-lg object-cover max-w-32"
                          />
                          <span className="font-semibold">{object.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex flex-col w-full bg-gray-950 bg-opacity-40 rounded-lg p-4 gap-2 min-w-60">
            <h2 className="text-xl font-bold">🎒 Mes objets</h2>
            <div className="flex flex-wrap gap-4">
              {gameData?.players
                ?.find(
                  (player) => player.id === localStorage.getItem("playerId")
                )
                ?.objects.map((object) => (
                  <div
                    key={object.id + gameData.playerIdTurn}
                    className={`flex flex-col items-center space-y-2 ${canUseObjects()
                        ? "cursor-pointer hover:ring-4 hover:ring-blue-500 hover:rounded-lg"
                        : "opacity-50 cursor-not-allowed"
                      }`}
                    onClick={() => {
                      if (canUseObjects()) {
                        socket.emit("PLAYER_ACTION", {
                          gameId: gameData.id,
                          playerId: localStorage.getItem("playerId"),
                          action_type: Actions.USE_OBJECT,
                          data: {
                            objectId: object.id,
                          },
                        });
                      }
                    }}
                  >
                    <img
                      // src={`/assets/${object.image}`}
                      src="https://www.gigamic-adds.com/images/games/hellapagos/cartes-extension/objets/bouee.jpg"
                      alt={object.description}
                      className="rounded-lg object-cover max-w-32"
                    />
                    <span className="font-semibold">{object.id}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col h-full w-6/12 p-6 gap-6 justify-between">
          <div className="flex flex-col w-full gap-6">
            <div className="flex w-full bg-gray-950 bg-opacity-30 rounded-lg py-3">
              <div className="flex flex-col items-start w-full gap-4 pl-3">
                <span className="text-lg font-semibold">
                  🌤️ Météo, Jour {gameData?.day}
                </span>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold">
                    {
                      weatherList[
                      gameData?.weatherList?.[0]
                        ?.description as keyof typeof weatherList
                      ]
                    }
                  </span>
                  <span className="font-semibold">
                    💧 Humidité : {gameData?.weatherList?.[0]?.water}
                  </span>
                </div>
              </div>
              <div className="h-full w-0.5 bg-gray-500" />
              <div className="flex flex-col items-start w-full gap-4 pl-3">
                <span className="font-semibold text-lg">🌴 Ressources</span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span>🐟</span>
                    <span className="font-semibold">
                      Nourriture : {gameData?.resourceIndicators?.food}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💧</span>
                    <span className="font-semibold">
                      Eau : {gameData?.resourceIndicators?.water}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🪵</span>
                    <span className="font-semibold">
                      Bois : {gameData?.resourceIndicators?.wood}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!gameData.isVotingActive ? (
              <div className="w-full bg-gray-950 bg-opacity-30 rounded-lg p-4">
                Au tour de{" "}
                {
                  gameData?.players?.find(
                    (player) => player.id === gameData.playerIdTurn
                  )?.name || "Joueur inconnu"
                }
              </div>
            ) : (
              <div className="flex flex-col space-y-4 w-full bg-gray-950 bg-opacity-30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl">🗳️ Vote en cours</span>
                  {gameData.isVotingActive && gameData.voteStartTime && gameData.voteDuration && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${remainingTime <= 10 ? "bg-red-900 bg-opacity-90 animate-pulse" : "bg-red-900 bg-opacity-70"
                      }`}>
                      <span className="text-2xl font-bold text-red-200">
                        ⏱️ {remainingTime}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Texte descriptif expliquant le vote */}
                <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg p-4">
                  <p className="font-semibold text-yellow-200 mb-2">
                    {gameData.votingReason === "water"
                      ? "💧 Pénurie d'eau !"
                      : gameData.votingReason === "food"
                        ? "🍖 Pénurie de nourriture !"
                        : gameData.votingReason === "raft"
                          ? "🚣 Manque de place sur le radeau !"
                          : "⚠️ Un vote est nécessaire"}
                  </p>
                  <p className="text-sm text-yellow-100 mb-2">
                    {gameData.votingReason === "water"
                      ? "Il n'y a pas assez d'eau pour tous les survivants. Vous devez voter pour désigner qui sera privé d'eau."
                      : gameData.votingReason === "food"
                        ? "Il n'y a pas assez de nourriture pour tous les survivants. Vous devez voter pour désigner qui sera privé de nourriture."
                        : gameData.votingReason === "raft"
                          ? "Il n'y a pas assez de places sur le radeau pour tous les survivants. Vous devez voter pour désigner qui restera sur l'île."
                          : "Vous devez voter pour désigner un joueur."}
                  </p>
                  <div className="text-xs text-yellow-200 mt-2 pt-2 border-t border-yellow-700">
                    <p className="font-semibold mb-1">💡 Ce que vous pouvez faire :</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Voter contre un autre joueur en cliquant sur son avatar (vous ne pouvez pas voter pour vous-même)</li>
                      <li>Vous pouvez changer votre vote à tout moment en cliquant sur un autre joueur</li>
                      <li>Si vous êtes désigné par le vote, vous pouvez jouer une carte {gameData.votingReason === "water" ? "Eau" : gameData.votingReason === "food" ? "Nourriture" : ""} pour vous sauver</li>
                      <li>Vous pouvez également utiliser d'autres cartes épave avant ou pendant le vote</li>
                      <li>Les joueurs malades ne peuvent pas voter, mais peuvent être désignés</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {gameData?.players
                    ?.filter((player, index, self) =>
                      index === self.findIndex((p) => p.id === player.id)
                    )
                    ?.filter((player) => player.status !== "dead")
                    ?.map((player) => {
                      const isCurrentPlayer = player.id === localStorage.getItem("playerId");
                      return (
                        <div
                          key={player.id + "vote"}
                          className="relative flex bg-gray-950 bg-opacity-30 rounded-lg p-2"
                        >
                          <button
                            onClick={() => {
                              if (!isPlayerDead && !isCurrentPlayer) {
                                socket.emit("VOTE", {
                                  gameId: gameData.id,
                                  playerId: localStorage.getItem("playerId"),
                                  targetPlayerId: player.id,
                                });
                              }
                            }}
                            disabled={isPlayerDead || isCurrentPlayer}
                            className={`p-0 h-12 w-12 rounded-full focus:outline-none ${isPlayerDead || isCurrentPlayer
                                ? "cursor-not-allowed opacity-50"
                                : "hover:ring-4 hover:ring-blue-500 cursor-pointer"
                              }`}
                          >
                            <div className="flex items-center space-x-4">
                              <img
                                src={`https://i.pravatar.cc/150?u=${player.id}`}
                                alt={player.name}
                                className="h-12 w-12 rounded-full"
                              />

                              <div className="flex flex-col items-start">
                                <span>{player.name || "Joueur sans nom"}</span>
                                {isCurrentPlayer && (
                                  <span className="text-xs text-gray-400 italic">(Vous)</span>
                                )}
                              </div>
                            </div>
                          </button>
                          {gameData.voting
                            .filter((vote) => vote.targetPlayerId === player.id)
                            .map((vote, index) => (
                              <div
                                key={vote.playerId + vote.targetPlayerId}
                                className="absolute right-2 h-12 w-12 bg-gray-950 bg-opacity-75 rounded-full border-2 border-white"
                                style={{
                                  transform: `translateX(${index * -60}%)`,
                                }}
                              >
                                <img
                                  src={`https://i.pravatar.cc/150?u=${vote.playerId}`}
                                  alt="Voter"
                                  className="h-full w-full rounded-full"
                                />
                              </div>
                            ))}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-950 bg-opacity-30 rounded-lg p-4">
            <div className="w-full gap-2">
              <h2 className="text-xl font-bold">🛠️ Actions</h2>
              {isPlayerDead && (
                <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg">
                  <p className="text-red-200 text-sm">
                    💀 Les actions sont désactivées car vous êtes mort.
                  </p>
                </div>
              )}
              <div className="flex w-full space-x-4">
                <button
                  disabled={actionsDisabled()}
                  onClick={() =>
                    socket.emit("PLAYER_ACTION", {
                      gameId: gameData?.id,
                      playerId: localStorage.getItem("playerId"),
                      action_type: Actions.SEARCH_WRECKAGE,
                    })
                  }
                  className={`flex-1 font-bold py-2 px-4 rounded ${isPlayerDead
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-slate-500 hover:bg-slate-800 text-white"
                    }`}
                >
                  🤿 Fouiller l'épave
                </button>
                <button
                  disabled={actionsDisabled()}
                  onClick={() =>
                    socket.emit("PLAYER_ACTION", {
                      gameId: gameData?.id,
                      playerId: localStorage.getItem("playerId"),
                      action_type: Actions.FISH,
                    })
                  }
                  className={`flex-1 font-bold py-2 px-4 rounded ${isPlayerDead
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-red-700 hover:bg-red-800 text-white"
                    }`}
                >
                  🎣 Pêcher
                </button>
                <button
                  disabled={actionsDisabled()}
                  onClick={() =>
                    socket.emit("PLAYER_ACTION", {
                      gameId: gameData?.id,
                      playerId: localStorage.getItem("playerId"),
                      action_type: Actions.COLLECT_WATER,
                    })
                  }
                  className={`flex-1 font-bold py-2 px-4 rounded ${isPlayerDead
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-blue-700 hover:bg-blue-800 text-white"
                    }`}
                >
                  🚰 Récupérer de l'eau
                </button>
                <button
                  disabled={actionsDisabled()}
                  onClick={() =>
                    socket.emit("PLAYER_ACTION", {
                      gameId: gameData?.id,
                      playerId: localStorage.getItem("playerId"),
                      action_type: Actions.COLLECT_WOOD,
                      data: {
                        woodToCollect: 1,
                      },
                    })
                  }
                  className={`flex-1 font-bold py-2 px-4 rounded ${isPlayerDead
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-green-700 hover:bg-green-800 text-white"
                    }`}
                >
                  🪵 Collecter du bois
                </button>
                {/* <button
                  onClick={() => {
                    socket.emit("RESET_GAME", { gameId: gameData.id });
                  }}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
                >
                  Reset Game
                </button> */}
              </div>
            </div>
          </div>
          {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") && (
            <div className="w-full bg-gray-950 bg-opacity-30 rounded-lg p-4 mt-4">
              <h2 className="text-xl font-bold mb-2">⚙️ Administration</h2>
              <button
                onClick={() => {
                  socket.emit("RESET_GAME", { gameId: gameData.id });
                }}
                className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded w-full"
              >
                🔄 Réinitialiser la partie et retourner au lobby
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
