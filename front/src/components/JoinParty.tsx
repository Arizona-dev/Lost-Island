import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getGame,
  startGame,
  updateVoteDuration,
  updatePrivate,
  updateDifficulty,
  updateGameLength,
  updateMaxPlayers,
  kickPlayer,
  banPlayer,
  resetGame,
} from "../services/gameService";
import { Game, GameState, GameEvents, GameStatus, IPlayer } from "../types";
import socket, { getSessionToken } from "../socket";

// Constants for game settings (same as CreateParty)
const VOTE_DURATION_MIN = 10;
const VOTE_DURATION_MAX = 300;
const VOTE_DURATION_DEFAULT = 30;
const MAX_PLAYERS_MIN = 3;
const MAX_PLAYERS_MAX = 12;
const MAX_PLAYERS_DEFAULT = 4;

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
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({
    private: null as boolean | null,
    difficulty: null as "normal" | "extreme" | null,
    gameLength: null as "normal" | "extended" | null,
    voteDuration: null as number | null,
    maxPlayers: null as number | null,
  });



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
        let gameResponse = await getGame(code, undefined, localStorage.getItem("playerId") || "");

        if (gameResponse.status === "started") {
          navigate(`/game/${gameResponse.partyCode}`);
          return;
        }

        // Add host check:
        if (gameResponse._id && gameResponse.partyOwner?.id === localStorage.getItem("playerId")) {
          setGameSettings(gameResponse);
          setPasswordError("");
          socket.emit("JOIN_GAME", {
            gameId: gameResponse._id,
            playerId: localStorage.getItem("playerId") || "",
            playerName: localStorage.getItem("playerName") || "",
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
                playerId: localStorage.getItem("playerId") || "",
                playerName: localStorage.getItem("playerName") || "",
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
            playerId: localStorage.getItem("playerId") || "",
            playerName: localStorage.getItem("playerName") || "",
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
                localStorage.getItem("playerId") || ""
              );
              if (authResponse._id) {
                // Saved password worked
                setGameSettings(authResponse);
                setPasswordError("");

                // Join the game room - this will trigger UPDATE_GAME_STATE automatically
                socket.emit("JOIN_GAME", {
                  gameId: authResponse._id,
                  playerId: localStorage.getItem("playerId") || "",
                  playerName: localStorage.getItem("playerName") || "",
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
            playerId: localStorage.getItem("playerId") || "",
            playerName: localStorage.getItem("playerName") || "",
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
  }, [navigate]);

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
            localStorage.getItem("playerId") || ""
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
            localStorage.getItem("playerId") || ""
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
            localStorage.getItem("playerId") || ""
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
        getGame(gameSettings.partyCode, undefined, localStorage.getItem("playerId") || "").then(
          (updatedGameSettings) => {
            if (updatedGameSettings) {
              setGameSettings(updatedGameSettings);
            }
          }
        );
      }
    });

    socket.on("SETTINGS_UPDATED", ({ gameId, settings }) => {
      // Update game settings when another player changes them
      if (gameSettings && gameSettings._id === gameId) {
        setGameSettings(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            voteDuration: settings.voteDuration,
            maxPlayers: settings.maxPlayers,
            private: settings.private,
            difficulty: settings.difficulty,
            gameLength: settings.gameLength
          };
        });
        // Clear any pending changes since settings have been updated
        setPendingChanges({
          private: null,
          difficulty: null,
          gameLength: null,
          voteDuration: null,
          maxPlayers: null,
        });
        setHasChanges(false);
      }
    });

    socket.on("PLAYER_KICKED", ({ gameId, playerId }) => {
      // Check if the current player is being kicked
      if (playerId === localStorage.getItem("playerId")) {
        // Current player was kicked - redirect to lobby
        setGameState(null);
        setGameSettings(null);
        setJoined(false);

        // Use setTimeout to ensure state updates complete before showing alert
        setTimeout(() => {
          window.confirm("Vous avez été expulsé de la partie par l'hôte.\n\nCliquez sur OK pour retourner au lobby.");
          navigate("/lobby");
        }, 100);
        return;
      }

      // Update game settings and state when another player is kicked
      if (gameSettings && gameSettings._id === gameId) {
        setGameSettings(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players?.filter(p => p.user.id !== playerId) || [],
          };
        });
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players?.filter(p => p.id !== playerId) || [],
          };
        });
      }
    });

    socket.on("PLAYER_BANNED", ({ gameId, playerId, playerName }) => {
      // Check if the current player is being banned
      if (playerId === localStorage.getItem("playerId")) {
        // Current player was banned - redirect to lobby
        setGameState(null);
        setGameSettings(null);
        setJoined(false);

        // Use setTimeout to ensure state updates complete before showing alert
        setTimeout(() => {
          window.confirm("Vous avez été banni de cette partie par l'hôte.\n\nCliquez sur OK pour retourner au lobby.");
          navigate("/lobby");
        }, 100);
        return;
      }

      // Update game settings and state when another player is banned
      if (gameSettings && gameSettings._id === gameId) {
        setGameSettings(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players?.filter(p => p.user.id !== playerId) || [],
            bannedPlayers: [...((prev.bannedPlayers as any) || []), { id: playerId, name: playerName }],
          } as any;
        });
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players?.filter(p => p.id !== playerId) || [],
          };
        });
      }
    });

    return () => {
      socket.off("error");
      socket.off("UPDATE_GAME_STATE");
      socket.off(GameEvents.PLAYER_JOINED);
      socket.off("SETTINGS_UPDATED");
      socket.off("PLAYER_KICKED");
      socket.off("PLAYER_BANNED");
      socket.off(GameEvents.PLAYER_LEFT);
      socket.off(GameEvents.PLAYER_LEFT_GAME);
      socket.off("GAME_STARTED");
      socket.off(GameEvents.GAME_ENDED);
      socket.off(GameEvents.GAME_RESET_TO_LOBBY);
      socket.off("SETTINGS_UPDATED");
    };
  }, [gameSettings, navigate]);

  useEffect(() => {
    if (gameSettings?._id && !joined) {
      socket.emit("JOIN_GAME", {
        gameId: gameSettings._id,
        playerId: localStorage.getItem("playerId") || "",
        playerName: localStorage.getItem("playerName") || "",
        sessionToken: getSessionToken(),
      });
      setJoined(true);
    }
  }, [gameSettings, joined]);

  const handleJoinParty = async () => {
    if (!gameSettings) {
      return;
    }

    // Check if player is already in the game to leave (only if we have full game data)
    if (
      gameSettings._id &&
      gameState?.players?.find((p) => p.id === localStorage.getItem("playerId"))
    ) {
      socket.emit("LEAVE_GAME", {
        gameId: gameSettings._id,
        playerId: localStorage.getItem("playerId") || "",
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
      localStorage.getItem("playerId") || ""
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

      socket.emit("JOIN_GAME", {
        gameId: gameResponse._id,
        playerId: localStorage.getItem("playerId") || "",
        playerName: localStorage.getItem("playerName") || "",
        sessionToken: getSessionToken(),
      });
      setGameState(prev => {
        if (!prev) return prev;
        if (prev.players.some(p => p.id === localStorage.getItem("playerId"))) return prev;
        return {
          ...prev,
          players: [...prev.players, { id: localStorage.getItem("playerId") || "", name: localStorage.getItem("playerName") || "", status: 'normal', voteCount: 1, objects: [] }]
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
      const updatedGame = await getGame(code, undefined, localStorage.getItem("playerId") || "");
      setGameSettings(updatedGame);

      // The game state will be updated via WebSocket event
    } catch (error) {
      console.error("Erreur lors de la réinitialisation de la partie:", error);
    }
  };

  const handleUpdatePrivate = () => {
    if (!gameSettings) return;
    const currentValue = pendingChanges.private ?? gameSettings.private;
    const newPrivate = !currentValue;

    // For private games, ask for password immediately when toggling to private
    if (newPrivate) {
      const password = prompt("Entrez un mot de passe pour la partie privée:");
      if (!password) return; // Cancelled
    }

    setPendingChanges(prev => ({
      ...prev,
      private: newPrivate
    }));
    setHasChanges(true);
  };

  const handleUpdateDifficulty = () => {
    if (!gameSettings) return;
    const currentValue = pendingChanges.difficulty ?? gameSettings.difficulty;
    const newDifficulty = currentValue === "normal" ? "extreme" : "normal";

    setPendingChanges(prev => ({
      ...prev,
      difficulty: newDifficulty
    }));
    setHasChanges(true);
  };

  const handleUpdateGameLength = () => {
    if (!gameSettings) return;
    const currentValue = pendingChanges.gameLength ?? gameSettings.gameLength;
    const newGameLength = currentValue === "normal" ? "extended" : "normal";

    setPendingChanges(prev => ({
      ...prev,
      gameLength: newGameLength
    }));
    setHasChanges(true);
  };

  const handleKickPlayer = async (playerId: string) => {
    if (!gameSettings) return;
    try {
      const code = gameSettings?.partyCode || partyCode;
      await kickPlayer(code, playerId);

      // Refresh game settings
      const updatedGame = await getGame(code, undefined, localStorage.getItem("playerId") || "");
      setGameSettings(updatedGame);

      // Broadcast kick event
      if (gameSettings?._id) {
        const kickedPlayer = gameSettings.players?.find(p => p.user.id === playerId);
        socket.emit("PLAYER_KICKED", {
          gameId: gameSettings._id,
          playerId,
          playerName: kickedPlayer?.user.name || "Unknown",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'expulsion du joueur:", error);
    }
  };

  const handleBanPlayer = async (playerId: string, playerName: string) => {
    if (!gameSettings) return;
    try {
      const code = gameSettings?.partyCode || partyCode;
      await banPlayer(code, playerId, playerName);

      // Refresh game settings
      const updatedGame = await getGame(code, undefined, localStorage.getItem("playerId") || "");
      setGameSettings(updatedGame);

      // Broadcast ban event
      if (gameSettings?._id) {
        socket.emit("PLAYER_BANNED", {
          gameId: gameSettings._id,
          playerId,
          playerName,
        });
      }
    } catch (error) {
      console.error("Erreur lors du bannissement du joueur:", error);
    }
  };


  // Only show password prompt for private games where user is not the host and not authenticated
  if (
    gameSettings?.private &&
    !gameSettings._id &&
    gameSettings.partyOwner?.id !== localStorage.getItem("playerId") &&
    !isAuthenticated
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 max-w-md mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">🔒 {gameSettings?.partyName}</h2>
          <p className="text-slate-300 text-lg">Entrez le mot de passe pour rejoindre le camp</p>
        </div>
        <div className="w-full max-w-sm">
          <input
            id="password"
            type="password"
            placeholder="Mot de passe secret"
            className="w-full p-3 bg-slate-800/60 border border-slate-600/40 rounded-lg text-white placeholder-slate-400/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 text-lg"
          />
          {passwordError && <p className="text-red-300 mt-2 text-sm flex items-center gap-1"><span className="text-xs">⚠️</span>{passwordError}</p>}
        </div>
        <button onClick={handleJoinParty} className="group relative px-8 py-3 bg-linear-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold rounded-lg shadow-xl hover:shadow-amber-900/30 transition-all duration-300 transform hover:scale-105 border-2 border-amber-500/50">
          <span className="flex items-center gap-2">
            <span className="text-lg group-hover:animate-bounce">🔑</span>
            Rejoindre le Camp
          </span>
        </button>
      </div>
    );
  }

  // Loading
  if (!gameSettings) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-4xl animate-spin">⏳</div><span className="ml-2 text-white">Chargement du camp...</span></div>;
  }


  // Main lobby
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-8 w-full">
      {/* Party Header */}
      <div className="flex flex-col items-center w-full max-w-6xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6">
        <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-lg flex items-center gap-2">
          🏕️ {gameSettings.partyName}
        </h2>
        <div className="flex items-center justify-center gap-8 text-lg font-bold text-white">
          <span>
            {getUniquePlayersCountFromGameState(gameState?.players) || getUniquePlayersCountFromDB(gameSettings.players)} / {gameSettings.maxPlayers} survivants
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Settings */}
        <div className="flex flex-col gap-6">
          {/* Game Settings Panel - Visible to all players */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2 drop-shadow-lg">
              ⚙️ Réglages du Camp
            </h4>
            {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? (
              <p className="text-slate-300 mb-6">Vous commandez ce camp - Tous les changements sont appliqués ensemble</p>
            ) : (
              <p className="text-slate-300 mb-6">Paramètres actuels de la partie</p>
            )}

            {/* All Settings in One Section */}
            <div className="grid grid-cols-1 gap-4">
              {/* Quick Settings */}
              <div className={`p-3 bg-slate-800/40 rounded-lg ${gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? "cursor-pointer hover:bg-slate-700/50 transition-colors" : ""}`} onClick={gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? handleUpdatePrivate : undefined}>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Visibilité</span>
                  <span className="text-slate-300">{(pendingChanges.private ?? gameSettings.private) ? "🔒 Privée" : "🌍 Publique"}</span>
                </div>
                {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") && <div className="text-xs mt-2 text-amber-400">Cliquez pour changer</div>}
              </div>
              <div className={`p-3 bg-slate-800/40 rounded-lg ${gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? "cursor-pointer hover:bg-slate-700/50 transition-colors" : ""}`} onClick={gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? handleUpdateDifficulty : undefined}>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Difficulté</span>
                  <span className="text-slate-300">{(pendingChanges.difficulty ?? gameSettings.difficulty) === "normal" ? "🌿 Normale" : "🔥 Extrême"}</span>
                </div>
                {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") && <div className="text-xs mt-2 text-amber-400">Cliquez pour changer</div>}
              </div>
              <div className={`p-3 bg-slate-800/40 rounded-lg ${gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? "cursor-pointer hover:bg-slate-700/50 transition-colors" : ""}`} onClick={gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? handleUpdateGameLength : undefined}>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Durée</span>
                  <span className="text-slate-300">{(pendingChanges.gameLength ?? gameSettings.gameLength) === "normal" ? "🌅 Normale" : "🌙 Prolongée"}</span>
                </div>
                {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") && <div className="text-xs mt-2 text-amber-400">Cliquez pour changer</div>}
              </div>

              {/* Vote Duration Display */}
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                  ⏱️ Durée du Vote <span className="text-xs text-slate-400">(secondes)</span>
                </label>
                <div className="flex items-center gap-4">
                  {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? (
                    <input
                      id="voteDurationInput"
                      type="range"
                      min={VOTE_DURATION_MIN}
                      max={VOTE_DURATION_MAX}
                      step={5}
                      defaultValue={(pendingChanges.voteDuration ?? gameSettings?.voteDuration) || 30}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${(((pendingChanges.voteDuration ?? gameSettings?.voteDuration) || VOTE_DURATION_DEFAULT) - VOTE_DURATION_MIN) / (VOTE_DURATION_MAX - VOTE_DURATION_MIN) * 100}%, #64748b ${(((pendingChanges.voteDuration ?? gameSettings?.voteDuration) || VOTE_DURATION_DEFAULT) - VOTE_DURATION_MIN) / (VOTE_DURATION_MAX - VOTE_DURATION_MIN) * 100}%, #64748b 100%)`,
                      }}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setPendingChanges(prev => ({
                          ...prev,
                          voteDuration: value
                        }));
                        setHasChanges(true);
                      }}
                    />
                  ) : (
                    <div className="flex-1 h-2 bg-slate-700 rounded-lg" style={{
                      background: `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${(((pendingChanges.voteDuration ?? gameSettings?.voteDuration) || VOTE_DURATION_DEFAULT) - VOTE_DURATION_MIN) / (VOTE_DURATION_MAX - VOTE_DURATION_MIN) * 100}%, #64748b ${(((pendingChanges.voteDuration ?? gameSettings?.voteDuration) || VOTE_DURATION_DEFAULT) - VOTE_DURATION_MIN) / (VOTE_DURATION_MAX - VOTE_DURATION_MIN) * 100}%, #64748b 100%)`,
                    }}></div>
                  )}
                  <span className="text-lg font-bold text-white min-w-[50px] text-center">
                    {(pendingChanges.voteDuration ?? gameSettings?.voteDuration) || 30}s
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10s</span>
                  <span>5min</span>
                </div>
              </div>

              {/* Max Players Display */}
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                  👥 Nombre de Survivants <span className="text-xs text-slate-400">(maximum)</span>
                </label>
                <div className="flex items-center gap-4">
                  {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") ? (
                    <input
                      id="maxPlayersInput"
                      type="range"
                      min={MAX_PLAYERS_MIN}
                      max={MAX_PLAYERS_MAX}
                      step={1}
                      defaultValue={(pendingChanges.maxPlayers ?? gameSettings?.maxPlayers) || 4}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${(((pendingChanges.maxPlayers ?? gameSettings?.maxPlayers) || MAX_PLAYERS_DEFAULT) - MAX_PLAYERS_MIN) / (MAX_PLAYERS_MAX - MAX_PLAYERS_MIN) * 100}%, #64748b ${(((pendingChanges.maxPlayers ?? gameSettings?.maxPlayers) || MAX_PLAYERS_DEFAULT) - MAX_PLAYERS_MIN) / (MAX_PLAYERS_MAX - MAX_PLAYERS_MIN) * 100}%, #64748b 100%)`,
                      }}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setPendingChanges(prev => ({
                          ...prev,
                          maxPlayers: value
                        }));
                        setHasChanges(true);
                      }}
                    />
                  ) : (
                    <div className="flex-1 h-2 bg-slate-700 rounded-lg" style={{
                      background: `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${(((pendingChanges.maxPlayers ?? gameSettings?.maxPlayers) || MAX_PLAYERS_DEFAULT) - MAX_PLAYERS_MIN) / (MAX_PLAYERS_MAX - MAX_PLAYERS_MIN) * 100}%, #64748b ${(((pendingChanges.maxPlayers ?? gameSettings?.maxPlayers) || MAX_PLAYERS_DEFAULT) - MAX_PLAYERS_MIN) / (MAX_PLAYERS_MAX - MAX_PLAYERS_MIN) * 100}%, #64748b 100%)`,
                    }}></div>
                  )}
                  <span className="text-lg font-bold text-white min-w-[50px] text-center">
                    {(pendingChanges.maxPlayers ?? gameSettings?.maxPlayers) || 4}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>3</span>
                  <span>12</span>
                </div>
              </div>
            </div>

            {/* Update All Settings Button - Only for host */}
            {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") && (
              <button
                className={`w-full group relative px-6 py-3 font-bold rounded-lg shadow-xl transition-all duration-300 transform hover:scale-105 border-2 ${
                  hasChanges
                    ? "bg-linear-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white border-amber-500/50 hover:shadow-amber-900/30"
                    : "bg-slate-600 text-slate-400 border-slate-500/50 cursor-not-allowed"
                }`}
                disabled={!hasChanges}
                onClick={async () => {
                  if (!hasChanges) return;

                  try {
                    const code = gameSettings?.partyCode || partyCode;
                    const promises = [];

                    // Handle private setting
                    if (pendingChanges.private !== null) {
                      let password = undefined;
                      if (pendingChanges.private) {
                        password = prompt("Entrez un mot de passe pour la partie privée:");
                        if (!password) return; // Cancelled
                      }
                      promises.push(updatePrivate(code, pendingChanges.private, password));
                    }

                    // Handle difficulty setting
                    if (pendingChanges.difficulty !== null) {
                      promises.push(updateDifficulty(code, pendingChanges.difficulty));
                    }

                    // Handle gameLength setting
                    if (pendingChanges.gameLength !== null) {
                      promises.push(updateGameLength(code, pendingChanges.gameLength));
                    }

                    // Handle voteDuration setting
                    if (pendingChanges.voteDuration !== null) {
                      promises.push(updateVoteDuration(code, pendingChanges.voteDuration));
                    }

                    // Handle maxPlayers setting
                    if (pendingChanges.maxPlayers !== null) {
                      promises.push(updateMaxPlayers(code, pendingChanges.maxPlayers));
                    }

                    if (promises.length > 0) {
                      await Promise.all(promises);

                      // Refresh game settings
                      const updatedGame = await getGame(code, undefined, localStorage.getItem("playerId") || "");
                      setGameSettings(updatedGame);
                      setPendingChanges({
                        private: null,
                        difficulty: null,
                        gameLength: null,
                        voteDuration: null,
                        maxPlayers: null,
                      });
                      setHasChanges(false); // Reset changes after successful update

                      // Broadcast settings update to all users
                      if (gameSettings?._id) {
                        socket.emit("SETTINGS_UPDATED", {
                          gameId: gameSettings._id,
                          settings: {
                            voteDuration: pendingChanges.voteDuration ?? updatedGame.voteDuration,
                            maxPlayers: pendingChanges.maxPlayers ?? updatedGame.maxPlayers,
                            private: pendingChanges.private ?? updatedGame.private,
                            difficulty: pendingChanges.difficulty ?? updatedGame.difficulty,
                            gameLength: pendingChanges.gameLength ?? updatedGame.gameLength
                          }
                        });
                      }
                    }
                  } catch (error) {
                    console.error("Erreur lors de la mise à jour des paramètres", error);
                  }
                }}
              >
                <span className="flex items-center justify-center gap-2 w-full">
                  <span className={`text-lg ${hasChanges ? "group-hover:animate-bounce" : ""}`}>⚡</span>
                  <span className="text-center flex-1">Appliquer les changements</span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Players and Join Button */}
        <div className="flex flex-col gap-6">
          {/* Players Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 drop-shadow-lg">
              👥 Survivants Connectés
            </h3>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {(getUniquePlayers(gameState?.players)?.length > 0
                ? getUniquePlayers(gameState?.players)
                : gameSettings?.players?.map((p) => ({
                    id: p.user.id,
                    name: p.user.name,
                  })))
              ?.map((displayedPlayer) => (
                <div key={displayedPlayer?.id} className="p-4 bg-slate-800/50 rounded-lg flex items-center justify-between text-white hover:bg-slate-700/50 transition-colors">
                  <span className="font-medium">{displayedPlayer?.name}</span>
                  <div className="flex items-center gap-2">
                    {displayedPlayer?.id === gameSettings?.partyOwner?.id && <span className="text-amber-400 text-sm font-bold">👑 Hôte</span>}
                    {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") && displayedPlayer?.id !== gameSettings?.partyOwner?.id && gameSettings?.status === "created" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleKickPlayer(displayedPlayer?.id || "")}
                          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          title="Expulser le joueur"
                        >
                          🚪
                        </button>
                        <button
                          onClick={() => handleBanPlayer(displayedPlayer?.id || "", displayedPlayer?.name || "")}
                          className="px-2 py-1 text-xs bg-red-800 hover:bg-red-900 text-white rounded transition-colors"
                          title="Bannir le joueur"
                        >
                          🚫
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {((getUniquePlayers(gameState?.players)?.length > 0
              ? getUniquePlayers(gameState?.players)
              : gameSettings?.players?.map((p) => ({
                  id: p.user.id,
                  name: p.user.name,
                })))?.length === 0 && (
              <p className="text-slate-400 text-center py-8">Aucun survivant connecté</p>
            ))}
          </div>

          {/* Game Control Buttons - Only for host */}
          {gameSettings?.partyOwner?.id === localStorage.getItem("playerId") && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2 drop-shadow-lg">
                🎮 Contrôles de Partie
              </h4>
              {gameSettings?.status === "finished" ||
              gameSettings?.status === "ended" ? (
                <button
                  className="w-full group relative px-6 py-3 bg-linear-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg shadow-xl hover:shadow-blue-900/30 transition-all duration-300 transform hover:scale-105 border-2 border-blue-600/50"
                  onClick={handleCreateNewGame}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg group-hover:animate-bounce">🔄</span>
                    Nouvelle Aventure
                  </span>
                </button>
              ) : (
                <button
                  className="w-full group relative px-6 py-3 bg-linear-to-r from-green-700 via-green-800 to-emerald-800 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-xl hover:shadow-green-900/30 transition-all duration-300 transform hover:scale-105 border-2 border-green-600/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={handleStartGame}
                  disabled={
                    (gameSettings?.players
                      ? getUniquePlayersCountFromDB(gameSettings.players)
                      : getUniquePlayersCountFromGameState(
                          gameState?.players
                        )) === 0 ||
                    (gameSettings?.players
                      ? getUniquePlayersCountFromDB(gameSettings.players)
                      : getUniquePlayersCountFromGameState(gameState?.players)) < 3
                  }
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg group-hover:animate-bounce">🚀</span>
                    {(gameSettings?.players
                      ? getUniquePlayersCountFromDB(gameSettings.players)
                      : getUniquePlayersCountFromGameState(gameState?.players)) > 0 &&
                    (gameSettings?.players
                      ? getUniquePlayersCountFromDB(gameSettings.players)
                      : getUniquePlayersCountFromGameState(gameState?.players)) < 3
                      ? "En Attente de Survivants"
                      : "Lancer l'Aventure"}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Status Message */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-4">
            <div className="text-center">
              {(gameSettings?.players
                ? getUniquePlayersCountFromDB(gameSettings.players)
                : getUniquePlayersCountFromGameState(gameState?.players)) < 3 ? (
                <p className="text-amber-300 text-lg font-medium">
                  🕐 En attente de plus de survivants...
                </p>
              ) : gameSettings?.status === "created" ? (
                <p className="text-blue-300 text-lg font-medium">
                  👑 Attente du lancement par l'hôte...
                </p>
              ) : null}
            </div>
          </div>

          {/* Join/Leave Button for non-hosts */}
          {gameSettings?.partyOwner?.id !== localStorage.getItem("playerId") && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6">
              <button
                onClick={handleJoinParty}
                className={`w-full group relative px-6 py-4 font-bold rounded-lg shadow-xl transition-all duration-300 transform hover:scale-105 border-2 ${
                  gameState?.players?.find((p) => p.id === localStorage.getItem("playerId"))
                    ? "bg-linear-to-r from-red-700 via-red-800 to-rose-800 hover:from-red-600 hover:to-rose-700 text-white border-red-600/50"
                    : "bg-linear-to-r from-emerald-600 via-green-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-600/50"
                }`}
                disabled={
                  (gameSettings?.players
                    ? getUniquePlayersCountFromDB(gameSettings.players)
                    : getUniquePlayersCountFromGameState(gameState?.players)) ===
                  gameSettings?.maxPlayers && !gameState?.players?.find((p) => p.id === localStorage.getItem("playerId"))
                }
              >
                <span className="flex items-center gap-2 text-lg">
                  <span className="group-hover:animate-bounce">
                    {gameState?.players?.find((p) => p.id === localStorage.getItem("playerId")) ? "🚪" : "➕"}
                  </span>
                  {gameState?.players?.find((p) => p.id === localStorage.getItem("playerId"))
                    ? "Quitter le Camp"
                    : "Rejoindre les Survivants"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {gameSettings?.error &&
        gameSettings?.partyOwner?.id !== localStorage.getItem("playerId") &&
        !gameSettings._id && (
          <div className="p-3 bg-red-900/40 border-2 border-red-600/50 rounded-lg">
            <p className="text-red-200 flex items-center gap-2"><span className="text-xs">⚠️</span>{gameSettings.error}</p>
          </div>
        )}
    </div>
  );
};

export default JoinParty;