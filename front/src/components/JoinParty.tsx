import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getGame,
  startGame,
  updateVoteDuration,
  resetGame,
} from "../services/gameService";
import { Game, GameState, GameEvents, GameStatus, IPlayer } from "../types";
import socket, { getSessionToken } from "../socket";

// Helper function to get unique players count from database players
const getUniquePlayersCountFromDB = (
  players: IPlayer[] | undefined
): number => {
  if (!players || players.length === 0) return 0;
  const uniquePlayerIds = new Set(
    players.map((p: IPlayer) => p?.user?.id).filter(Boolean)
  );
  return uniquePlayerIds.size;
};

// Helper function to get unique players count from gameState
const getUniquePlayersCountFromGameState = (
  players: GameState["players"] | undefined
): number => {
  if (!players || players.length === 0) return 0;
  const uniquePlayerIds = new Set(players.map((p) => p.id));
  return uniquePlayerIds.size;
};

// Helper function to get unique players
const getUniquePlayers = (players: GameState["players"] | undefined) => {
  if (!players) return [];
  return players.filter(
    (player, index, self) => index === self.findIndex((p) => p.id === player.id)
  );
};

const JoinParty = () => {
  const [gameSettings, setGameSettings] = useState<Partial<Game> | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [passwordError, setPasswordError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [partyCode, setPartyCode] = useState<string>("");
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);

  const player = useMemo(
    () => ({
      id: localStorage.getItem("playerId") || "",
      name: localStorage.getItem("playerName") || "",
    }),
    []
  );

  useEffect(() => {
    document.title = "Rejoindre une Partie";
    const fetchGame = async () => {
      try {
        const urlParts = window.location.pathname.split("/");
        const code = urlParts[urlParts.length - 1];
        if (!code) {
          navigate("/lobby");
          return;
        }
        setPartyCode(code);
        let gameResponse = await getGame(code, undefined, player.id);

        if (gameResponse.status === "started") {
          navigate(`/game/${gameResponse.partyCode}`);
          return;
        }

        // Add host check:
        if (gameResponse._id && gameResponse.partyOwner?.id === player.id) {
          setGameSettings(gameResponse);
          setPasswordError("");
          socket.emit("JOIN_GAME", {
            gameId: gameResponse._id,
            playerId: player.id,
            playerName: player.name,
            sessionToken: getSessionToken(),
          });
          return;
        }

        // If we got full game data (has _id), the player is already authenticated
        if (gameResponse._id) {
          // For private games, check if we have the password saved in localStorage
          // If not, we need to prompt for it even though the player is authenticated
          if (gameResponse.private) {
            const savedPasswords = JSON.parse(
              localStorage.getItem("lobbyPasswords") || "{}"
            );
            const savedPassword = savedPasswords[code];

            if (savedPassword) {
              // We have a saved password for a private game we're already authenticated in
              // No need to re-authenticate, just proceed normally
              setGameSettings(gameResponse);
              setPasswordError("");

              // Join the game room - this will trigger UPDATE_GAME_STATE automatically
              socket.emit("JOIN_GAME", {
                gameId: gameResponse._id,
                playerId: player.id,
                playerName: player.name,
                sessionToken: getSessionToken(),
              });
              return;
            }

            // No saved password, show password prompt
            // Create limited game data without _id to trigger password prompt
            // But keep all other fields like maxPlayers for proper display
            const limitedGameData = {
              ...gameResponse,
              _id: undefined, // Remove _id to trigger password prompt
              error: "Mot de passe requis",
            };
            setGameSettings(limitedGameData);
            setPasswordError("Mot de passe requis");
            setIsAuthenticated(false);
            return;
          }

          // Public game - proceed normally
          setGameSettings(gameResponse);
          setPasswordError("");

          // Join the game room - this will trigger UPDATE_GAME_STATE automatically
          socket.emit("JOIN_GAME", {
            gameId: gameResponse._id,
            playerId: player.id,
            playerName: player.name,
            sessionToken: getSessionToken(),
          });
          return;
        }

        // Try saved password for private games (including for the host)
        if (gameResponse.private) {
          const savedPasswords = JSON.parse(
            localStorage.getItem("lobbyPasswords") || "{}"
          );
          const savedPassword = savedPasswords[code];

          if (savedPassword) {
            // Try to authenticate with saved password
            try {
              const authResponse = await getGame(
                code,
                savedPassword,
                player.id
              );
              if (authResponse._id) {
                // Saved password worked
                setGameSettings(authResponse);
                setPasswordError("");

                // Join the game room - this will trigger UPDATE_GAME_STATE automatically
                socket.emit("JOIN_GAME", {
                  gameId: authResponse._id,
                  playerId: player.id,
                  playerName: player.name,
                  sessionToken: getSessionToken(),
                });
                return;
              } else {
                // Saved password didn't return _id
              }
            } catch (error) {
              // Saved password failed, remove it
              delete savedPasswords[code];
              localStorage.setItem(
                "lobbyPasswords",
                JSON.stringify(savedPasswords)
              );
            }
          } else {
            // No saved password found
          }

          // No saved password or it didn't work, show password prompt
          setGameSettings(gameResponse);
          setPasswordError(gameResponse.error || "");
          setIsAuthenticated(false);
          return;
        }

        // Allow accessing lobby even if game is ended
        setGameSettings(gameResponse);
        setPasswordError(gameResponse.error || "");

        // Always fetch game state and join the game room, even if ended
        // This allows players to see final statistics and stay connected
        if (gameResponse._id) {
          socket.emit("JOIN_GAME", {
            gameId: gameResponse._id,
            playerId: player.id,
            playerName: player.name,
            sessionToken: getSessionToken(),
          });
          socket.emit("FETCH_GAME_STATE", { gameId: gameResponse._id });
        }
      } catch (error) {
        console.log(error);
        navigate("/lobby");
      }
    };

    fetchGame();
  }, [navigate, player.id, player.name]);

  useEffect(() => {
    socket.on("error", (error: string) => {
      console.error(error);
    });

    socket.on("UPDATE_GAME_STATE", async (game: GameState) => {
      // For ended games, don't update state at all to prevent any redirects
      if (game.status === GameStatus.ENDED) {
        return;
      }

      setGameState(game);

      // Rafraîchir gameSettings depuis la base de données pour avoir le comptage correct
      if (gameSettings?.partyCode) {
        try {
          const updatedGameSettings = await getGame(
            gameSettings.partyCode,
            undefined,
            player.id
          );
          if (updatedGameSettings) {
            setGameSettings(updatedGameSettings);
          }
        } catch (error) {
          console.error(
            "Erreur lors du rafraîchissement de gameSettings:",
            error
          );
        }
      }
    });

    socket.on(GameEvents.PLAYER_JOINED, async () => {
      // Rafraîchir gameSettings quand un joueur rejoint
      if (gameSettings?.partyCode) {
        try {
          const updatedGameSettings = await getGame(
            gameSettings.partyCode,
            undefined,
            player.id
          );
          if (updatedGameSettings) {
            setGameSettings(updatedGameSettings);
          }
        } catch (error) {
          console.error(
            "Erreur lors du rafraîchissement de gameSettings:",
            error
          );
        }
      }
      // Also fetch updated game state to show new players
      if (gameSettings?._id) {
        socket.emit("FETCH_GAME_STATE", { gameId: gameSettings._id });
      }
    });

    socket.on(GameEvents.PLAYER_LEFT, async ({ playerId }) => {
      setGameState(prev => {
        if (!prev) return prev;
        const newPlayers = prev.players.filter(p => p.id !== playerId);
        return {
          ...prev,
          players: newPlayers
        };
      });
      // Rafraîchir gameSettings quand un joueur quitte
      if (gameSettings?.partyCode) {
        try {
          const updatedGameSettings = await getGame(
            gameSettings.partyCode,
            undefined,
            player.id
          );
          if (updatedGameSettings) {
            setGameSettings(updatedGameSettings);
          }
        } catch (error) {
          console.error(
            "Erreur lors du rafraîchissement de gameSettings:",
            error
          );
        }
      }
      // Also fetch updated game state to show updated players list immediately
      if (gameSettings?._id) {
        socket.emit("FETCH_GAME_STATE", { gameId: gameSettings._id });
      }
    });

    socket.on(GameEvents.PLAYER_LEFT_GAME, ({ playerId }) => {
      setGameState(prev => {
        if (!prev) return prev;
        const newPlayers = prev.players.filter(p => p.id !== playerId);
        return {
          ...prev,
          players: newPlayers
        };
      });
    });

    socket.on("GAME_STARTED", () => {
      navigate(`/game/${gameSettings?.partyCode}`);
    });

    socket.on(GameEvents.GAME_ENDED, ({ gameId }) => {
      // Clear saved password when game ends
      if (gameSettings && gameSettings._id === gameId) {
        const savedPasswords = JSON.parse(
          localStorage.getItem("lobbyPasswords") || "{}"
        );
        delete savedPasswords[gameSettings.partyCode!];
        localStorage.setItem("lobbyPasswords", JSON.stringify(savedPasswords));
      }
    });

    socket.on(GameEvents.GAME_RESET_TO_LOBBY, ({ gameState }) => {
      // Mettre à jour le gameState avec le state reset
      if (gameState) {
        setGameState(gameState);
      }
      // Rafraîchir les gameSettings depuis la base de données
      if (gameSettings?.partyCode) {
        getGame(gameSettings.partyCode, undefined, player.id).then(
          (updatedGameSettings) => {
            if (updatedGameSettings) {
              setGameSettings(updatedGameSettings);
            }
          }
        );
      }
    });

    return () => {
      socket.off("error");
      socket.off("UPDATE_GAME_STATE");
      socket.off(GameEvents.PLAYER_JOINED);
      socket.off(GameEvents.PLAYER_LEFT);
      socket.off(GameEvents.PLAYER_LEFT_GAME);
      socket.off("GAME_STARTED");
      socket.off(GameEvents.GAME_ENDED);
      socket.off(GameEvents.GAME_RESET_TO_LOBBY);
    };
  }, [gameSettings, navigate]);

  useEffect(() => {
    if (gameSettings?._id && !joined) {
      socket.emit("JOIN_GAME", {
        gameId: gameSettings._id,
        playerId: player.id,
        playerName: player.name,
        sessionToken: getSessionToken(),
      });
      setJoined(true);
    }
  }, [gameSettings, joined, player.id, player.name]);

  const handleJoinParty = async () => {
    if (!gameSettings) {
      return;
    }

    // Check if player is already in the game to leave (only if we have full game data)
    if (
      gameSettings._id &&
      gameState?.players?.find((p) => p.id === player.id)
    ) {
      socket.emit("LEAVE_GAME", {
        gameId: gameSettings._id,
        playerId: player.id,
        sessionToken: getSessionToken(),
      });
      setGameState(null);
      navigate("/lobby");
      return;
    }

    const password = (document.getElementById("password") as HTMLInputElement)
      ?.value;

    if ((!password && gameSettings.private) || !gameSettings) {
      document.getElementById("password")?.focus();
      setPasswordError("Veuillez entrer un mot de passe.");
      return;
    }

    const gameResponse = await getGame(
      gameSettings.partyCode!,
      password,
      player.id
    );

    if (gameResponse.error) {
      // Password is incorrect
      setPasswordError(gameResponse.error);
      return;
    }

    if (gameResponse._id) {
      // Password is correct - update gameSettings with full game data
      setPasswordError("");
      setGameSettings(gameResponse);
      setIsAuthenticated(true);

      // Save password for this lobby so user doesn't have to enter it again
      if (password) {
        const savedPasswords = JSON.parse(
          localStorage.getItem("lobbyPasswords") || "{}"
        );
        savedPasswords[gameResponse.partyCode] = password;
        localStorage.setItem("lobbyPasswords", JSON.stringify(savedPasswords));
      }

      const player = {
        id: localStorage.getItem("playerId") || "",
        name: localStorage.getItem("playerName") || "",
      };

      socket.emit("JOIN_GAME", {
        gameId: gameResponse._id,
        playerId: player.id,
        playerName: player.name,
        sessionToken: getSessionToken(),
      });
      setGameState(prev => {
        if (!prev) return prev;
        if (prev.players.some(p => p.id === player.id)) return prev;
        return {
          ...prev,
          players: [...prev.players, { id: player.id, name: player.name, status: 'normal', voteCount: 1, objects: [] }]
        };
      });
    }
  };

  const handleStartGame = async () => {
    if (!gameSettings) {
      return;
    }
    await startGame(gameSettings._id!);
    const code = gameSettings?.partyCode || partyCode;
    navigate(`/game/${code}`);
  };

  const handleCreateNewGame = async () => {
    if (!gameSettings) {
      return;
    }

    try {
      // Reset the current game instead of creating a new one
      await resetGame(gameSettings._id!);

      // Refresh the game data to get the updated state
      const code = gameSettings?.partyCode || partyCode;
      const updatedGame = await getGame(code, undefined, player.id);
      setGameSettings(updatedGame);

      // The game state will be updated via WebSocket event
    } catch (error) {
      console.error("Erreur lors de la réinitialisation de la partie:", error);
    }
  };

  // Only show password prompt for private games where user is not the host and not authenticated
  if (
    gameSettings?.private &&
    !gameSettings._id &&
    gameSettings.partyOwner?.id !== player.id &&
    !isAuthenticated
  ) {
    return (
      <div className="flex flex-col items-center justify-center p-4 gap-4 max-w-md border border-amber-600 rounded-xl bg-slate-800">
        <h2 className="text-2xl font-bold">{gameSettings?.partyName}</h2>
        <p className="">
          Veuillez entrer le mot de passe pour rejoindre la partie.
        </p>
        <input
          id="password"
          type="password"
          placeholder="Mot de passe"
          className="input"
        />
        {passwordError && <p className="text-red-500">{passwordError}</p>}
        <button onClick={handleJoinParty} className="btn btn-primary">
          Rejoindre la partie
        </button>
      </div>
    );
  }

  // Don't render until we have game settings
  if (!gameSettings) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full items-center px-8">
      <div className="flex items-center justify-between bg-neutral-700 p-4 rounded-lg w-full max-w-7xl h-fit gap-16 mb-8">
        <h2 className="text-2xl font-bold">{gameSettings.partyName}</h2>
        <div className="text-neutral-400 flex gap-6">
          <p className="text-neutral-400">
            {gameSettings.private ? "Partie privée" : "Partie publique"}
          </p>
          <p className="text-neutral-400">
            <b>Difficulté : </b>
            {gameSettings.difficulty === "normal" ? "normale" : "extrême"}
          </p>
          <p className="text-neutral-400">
            <b>Durée : </b>
            {gameSettings.gameLength === "normal" ? "normale" : "prolongée"}
          </p>
        </div>
        <p className="text-neutral-400">
          {getUniquePlayersCountFromGameState(gameState?.players) ||
            getUniquePlayersCountFromDB(gameSettings.players)}{" "}
          / {gameSettings.maxPlayers} joueurs
        </p>
      </div>
      <div className="flex flex-col items-center p-4 gap-4 max-w-md w-full border border-amber-600 rounded-xl bg-neutral-700">
        <h2 className="text-xl font-bold border-b w-full text-center">
          Joueurs connectés
        </h2>
        <div className="flex flex-col items-center gap-2 w-full">
          {(getUniquePlayers(gameState?.players)?.length > 0
            ? getUniquePlayers(gameState?.players)
            : gameSettings?.players?.map((p) => ({
                id: p.user.id,
                name: p.user.name,
              }))
          )?.map((player) => (
            <p key={player?.id}>
              {player?.name}
              {player?.id === gameSettings?.partyOwner?.id && " (Hôte)"}
            </p>
          ))}
        </div>
        {gameSettings?.partyOwner?.id === player.id ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <p className="text-neutral-400">
              Vous êtes le propriétaire de la partie
            </p>

            {/* Configuration de voteDuration */}
            <div className="flex flex-col w-full gap-2">
              <label className="text-sm text-neutral-400">
                Durée du vote (secondes)
              </label>
              <div className="flex gap-2">
                <input
                  id="voteDurationInput"
                  type="number"
                  defaultValue={gameSettings?.voteDuration || 30}
                  min={10}
                  max={300}
                  className="flex-1 p-2 border border-neutral-500 rounded-md text-black"
                />
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  onClick={async () => {
                    const voteDuration = Number(
                      (
                        document.getElementById(
                          "voteDurationInput"
                        ) as HTMLInputElement
                      ).value
                    );
                    if (voteDuration >= 10 && voteDuration <= 300) {
                      try {
                        const code = gameSettings?.partyCode || partyCode;
                        await updateVoteDuration(code, voteDuration);
                        const updatedGame = await getGame(
                          code,
                          undefined,
                          player.id
                        );
                        setGameSettings(updatedGame);
                      } catch (error) {
                        console.error(
                          "Erreur lors de la mise à jour de voteDuration",
                          error
                        );
                      }
                    }
                  }}
                >
                  Mettre à jour
                </button>
              </div>
              <span className="text-xs text-neutral-400">
                10 à 300 secondes
              </span>
            </div>

            {gameSettings?.status === "finished" ||
            gameSettings?.status === "ended" ? (
              <button
                className="btn btn-primary w-full bg-blue-700 hover:bg-blue-800"
                onClick={handleCreateNewGame}
              >
                Nouvelle partie
              </button>
            ) : (
              <button
                className="btn btn-primary w-full bg-green-700 hover:bg-green-800"
                onClick={handleStartGame}
                disabled={
                  (gameSettings?.players
                    ? getUniquePlayersCountFromDB(gameSettings.players)
                    : getUniquePlayersCountFromGameState(
                        gameState?.players
                      )) === 0 ||
                  (gameSettings?.players
                    ? getUniquePlayersCountFromDB(gameSettings.players)
                    : getUniquePlayersCountFromGameState(gameState?.players)) <
                    3
                }
              >
                {(gameSettings?.players
                  ? getUniquePlayersCountFromDB(gameSettings.players)
                  : getUniquePlayersCountFromGameState(gameState?.players)) >
                  0 &&
                (gameSettings?.players
                  ? getUniquePlayersCountFromDB(gameSettings.players)
                  : getUniquePlayersCountFromGameState(gameState?.players)) < 3
                  ? "En attente de joueurs"
                  : "Démarrer la partie"}
              </button>
            )}
          </div>
        ) : (
          <button onClick={handleJoinParty} className="btn btn-primary w-full">
            {(gameSettings?.players
              ? getUniquePlayersCountFromDB(gameSettings.players)
              : getUniquePlayersCountFromGameState(gameState?.players)) ===
            gameSettings?.maxPlayers
              ? "Partie pleine"
              : gameState?.players?.find((p) => p.id === player.id)
              ? "Quitter la partie"
              : "Rejoindre la partie"}
          </button>
        )}
        {gameSettings?.error &&
          gameSettings?.partyOwner?.id !== player.id &&
          !gameSettings._id && (
            <p className="text-red-500">{gameSettings.error}</p>
          )}
      </div>
    </div>
  );
};

export default JoinParty;
