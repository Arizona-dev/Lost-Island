import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGame, startGame, updateVoteDuration, resetGame } from "../services/gameService";
import { Game, GameState, GameEvents, GameStatus, IPlayer } from "../types";
import socket from "../socket";

// Helper function to get unique players count from database players
const getUniquePlayersCountFromDB = (players: IPlayer[] | undefined): number => {
  if (!players || players.length === 0) return 0;
  const uniquePlayerIds = new Set(players.map((p: IPlayer) => p?.user?.id).filter(Boolean));
  return uniquePlayerIds.size;
};

// Helper function to get unique players count from gameState
const getUniquePlayersCountFromGameState = (players: GameState["players"] | undefined): number => {
  if (!players || players.length === 0) return 0;
  const uniquePlayerIds = new Set(players.map((p) => p.id));
  return uniquePlayerIds.size;
};

// Helper function to get unique players
const getUniquePlayers = (players: GameState["players"] | undefined) => {
  if (!players) return [];
  return players.filter(
    (player, index, self) =>
      index === self.findIndex((p) => p.id === player.id)
  );
};

const JoinParty = () => {
  const [gameSettings, setGameSettings] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const player = {
    id: localStorage.getItem("playerId") || "",
    name: localStorage.getItem("playerName") || "",
  };

  useEffect(() => {
    document.title = "Rejoindre une Partie";
    const fetchGame = async () => {
      try {
        const code = window.location.pathname.split("/").pop();
        if (!code) {
          navigate("/lobby");
          return;
        }
        const gameResponse = await getGame(code);

        if (gameResponse.status === "started") {
          navigate(`/game/${gameResponse.partyCode}`);
          return;
        }

        // Allow accessing lobby even if game is ended
        setGameSettings(gameResponse);
        setPasswordError(gameResponse.error || "");

        // Always fetch game state and join the game room, even if ended
        // This allows players to see final statistics and stay connected
        socket.emit("FETCH_GAME_STATE", { gameId: gameResponse._id });
        socket.emit("JOIN_GAME", {
          gameId: gameResponse._id,
          playerId: player.id,
          playerName: player.name,
        });
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
      console.log("UPDATE_GAME_STATE", game);

      // Rafraîchir gameSettings depuis la base de données pour avoir le comptage correct
      if (gameSettings?.partyCode) {
        try {
          const updatedGameSettings = await getGame(gameSettings.partyCode);
          if (updatedGameSettings) {
            setGameSettings(updatedGameSettings);
          }
        } catch (error) {
          console.error("Erreur lors du rafraîchissement de gameSettings:", error);
        }
      }
    });

    socket.on(GameEvents.PLAYER_JOINED, async () => {
      // Rafraîchir gameSettings quand un joueur rejoint
      if (gameSettings?.partyCode) {
        try {
          const updatedGameSettings = await getGame(gameSettings.partyCode);
          if (updatedGameSettings) {
            setGameSettings(updatedGameSettings);
          }
        } catch (error) {
          console.error("Erreur lors du rafraîchissement de gameSettings:", error);
        }
      }
    });

    socket.on(GameEvents.PLAYER_LEFT, async () => {
      // Rafraîchir gameSettings quand un joueur quitte
      if (gameSettings?.partyCode) {
        try {
          const updatedGameSettings = await getGame(gameSettings.partyCode);
          if (updatedGameSettings) {
            setGameSettings(updatedGameSettings);
          }
        } catch (error) {
          console.error("Erreur lors du rafraîchissement de gameSettings:", error);
        }
      }
    });

    socket.on("GAME_STARTED", () => {
      navigate(`/game/${gameSettings?.partyCode}`);
    });

    socket.on(GameEvents.GAME_RESET_TO_LOBBY, ({ gameState }) => {
      console.log("GAME_RESET_TO_LOBBY reçu, mise à jour du state");
      // Mettre à jour le gameState avec le state reset
      if (gameState) {
        setGameState(gameState);
      }
      // Rafraîchir les gameSettings depuis la base de données
      if (gameSettings?.partyCode) {
        getGame(gameSettings.partyCode).then((updatedGameSettings) => {
          if (updatedGameSettings) {
            setGameSettings(updatedGameSettings);
          }
        });
      }
    });

    return () => {
      socket.off("error");
      socket.off("UPDATE_GAME_STATE");
      socket.off(GameEvents.PLAYER_JOINED);
      socket.off(GameEvents.PLAYER_LEFT);
      socket.off("GAME_STARTED");
      socket.off(GameEvents.GAME_RESET_TO_LOBBY);
    };
  }, [gameSettings, navigate]);

  const handleJoinParty = async () => {
    if (!gameSettings) {
      return;
    }

    // Check if player is already in the game to leave
    if (gameState?.players?.find((p) => p.id === player.id)) {
      socket.emit("LEAVE_GAME", {
        gameId: gameSettings._id,
        playerId: player.id,
      });
      return;
    }

    const password = (document.getElementById("password") as HTMLInputElement)
      ?.value;

    if ((!password && gameSettings.private) || !gameSettings) {
      document.getElementById("password")?.focus();
      setPasswordError("Veuillez entrer un mot de passe.");
      return;
    }

    const gameResponse = await getGame(gameSettings.partyCode, password);
    setPasswordError("");

    if (gameResponse._id) {
      const player = {
        id: localStorage.getItem("playerId") || "",
        name: localStorage.getItem("playerName") || "",
      };

      socket.emit("JOIN_GAME", {
        gameId: gameResponse._id,
        playerId: player.id,
        playerName: player.name,
      });
    }
  };

  const handleStartGame = async () => {
    if (!gameSettings) {
      return;
    }
    await startGame(gameSettings._id);
    navigate(`/game/${gameSettings.partyCode}`);
  };

  const handleCreateNewGame = async () => {
    if (!gameSettings) {
      return;
    }

    try {
      // Reset the current game instead of creating a new one
      await resetGame(gameSettings._id);

      // Refresh the game data to get the updated state
      const updatedGame = await getGame(gameSettings.partyCode);
      setGameSettings(updatedGame);

      // The game state will be updated via WebSocket event
    } catch (error) {
      console.error("Erreur lors de la réinitialisation de la partie:", error);
    }
  };

  if (gameSettings?.private && !gameSettings._id) {
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

  return (
    <div className="flex flex-col w-full h-full items-center px-8">
      <div className="flex items-center justify-between bg-neutral-700 p-4 rounded-lg w-full max-w-7xl h-fit gap-16 mb-8">
        <h2 className="text-2xl font-bold">{gameSettings?.partyName}</h2>
        <div className="text-neutral-400 flex gap-6">
          <p className="text-neutral-400">
            {gameSettings?.private ? "Partie privée" : "Partie publique"}
          </p>
          <p className="text-neutral-400">
            <b>Difficulté : </b>
            {gameSettings?.difficulty === "normal" ? "normale" : "extrême"}
          </p>
          <p className="text-neutral-400">
            <b>Durée : </b>
            {gameSettings?.gameLength === "normal" ? "normale" : "prolongée"}
          </p>
        </div>
        <p className="text-neutral-400">
          {getUniquePlayersCountFromGameState(gameState?.players)} / {gameSettings?.maxPlayers} joueurs
        </p>
      </div>
      <div className="flex flex-col items-center p-4 gap-4 max-w-md w-full border border-amber-600 rounded-xl bg-neutral-700">
        <h2 className="text-xl font-bold border-b w-full text-center">
          Joueurs connectés
        </h2>
        <div className="flex flex-col items-center gap-2 w-full">
          {getUniquePlayers(gameState?.players)?.map((player) => (
            <p key={player?.id}>{player?.name}</p>
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
                      (document.getElementById("voteDurationInput") as HTMLInputElement).value
                    );
                    if (voteDuration >= 10 && voteDuration <= 300) {
                      try {
                        await updateVoteDuration(gameSettings._id, voteDuration);
                        const updatedGame = await getGame(gameSettings.partyCode);
                        setGameSettings(updatedGame);
                      } catch (error) {
                        console.error("Erreur lors de la mise à jour de voteDuration", error);
                      }
                    }
                  }}
                >
                  Mettre à jour
                </button>
              </div>
              <span className="text-xs text-neutral-400">10 à 300 secondes</span>
            </div>

            {gameSettings?.status === "finished" || gameSettings?.status === "ended" ? (
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
                    : getUniquePlayersCountFromGameState(gameState?.players)) === 0 ||
                  (gameSettings?.players
                    ? getUniquePlayersCountFromDB(gameSettings.players)
                    : getUniquePlayersCountFromGameState(gameState?.players)) < 3
                }
              >
                {((gameSettings?.players
                    ? getUniquePlayersCountFromDB(gameSettings.players)
                    : getUniquePlayersCountFromGameState(gameState?.players)) > 0 &&
                (gameSettings?.players
                    ? getUniquePlayersCountFromDB(gameSettings.players)
                    : getUniquePlayersCountFromGameState(gameState?.players)) < 3)
                  ? "En attente de joueurs"
                  : "Démarrer la partie"}
              </button>
            )}
          </div>
        ) : (
          <button onClick={handleJoinParty} className="btn btn-primary w-full">
            {(gameSettings?.players 
                ? getUniquePlayersCountFromDB(gameSettings.players) 
                : getUniquePlayersCountFromGameState(gameState?.players)) === gameSettings?.maxPlayers
              ? "Partie pleine"
              : gameState?.players?.find((p) => p.id === player.id)
              ? "Quitter la partie"
              : "Rejoindre la partie"}
          </button>
        )}
        {gameSettings?.error && (
          <p className="text-red-500">{gameSettings.error}</p>
        )}
      </div>
    </div>
  );
};

export default JoinParty;
