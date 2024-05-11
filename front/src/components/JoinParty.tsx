import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGame, startGame } from "../services/gameService";
import { GameSettings, GameState } from "../types";
import socket from "../socket";

const JoinParty = () => {
  const [game, setGame] = useState<GameSettings | null>(null);
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
        setGame(gameResponse);
        setPasswordError(gameResponse.error || "");

        socket.emit("FETCH_GAME_STATE", gameResponse.partyCode);
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

    socket.on("UPDATE_GAME_STATE", (game: GameState) => {
      setGameState(game);
      console.log("UPDATE_GAME_STATE", game);
    });
  }, []);

  const handleJoinParty = async () => {
    if (!game) {
      return;
    }

    // Check if player is already in the game to leave
    if (gameState?.players?.find((p) => p.id === player.id)) {
      socket.emit("LEAVE_GAME", {
        gameId: game._id,
        playerId: player.id,
      });
      return;
    }

    const password = (document.getElementById("password") as HTMLInputElement)
      ?.value;

    if ((!password && game.private) || !game) {
      document.getElementById("password")?.focus();
      setPasswordError("Veuillez entrer un mot de passe.");
      return;
    }

    const gameResponse = await getGame(game.partyCode, password);
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
    if (!game) {
      return;
    }
    await startGame(game._id);
    navigate(`/game/${game.partyCode}`);
  };

  if (game?.private && !game._id) {
    return (
      <div className="flex flex-col items-center justify-center p-4 gap-4 max-w-md border border-amber-600 rounded-xl bg-slate-800">
        <h2 className="text-2xl font-bold">{game?.partyName}</h2>
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
        <h2 className="text-2xl font-bold">{game?.partyName}</h2>
        <div className="text-neutral-400 flex gap-6">
          <p className="text-neutral-400">
            {game?.private ? "Partie privée" : "Partie publique"}
          </p>
          <p className="text-neutral-400">
            <b>Difficulté : </b>
            {game?.difficulty === "normal" ? "normale" : "extrême"}
          </p>
          <p className="text-neutral-400">
            <b>Durée : </b>
            {game?.gameLength === "normal" ? "normale" : "prolongée"}
          </p>
        </div>
        <p className="text-neutral-400">
          {gameState?.players?.length ?? 0} / {game?.maxPlayers} joueurs
        </p>
      </div>
      <div className="flex flex-col items-center p-4 gap-4 max-w-md w-full border border-amber-600 rounded-xl bg-neutral-700">
        <h2 className="text-xl font-bold border-b w-full text-center">
          Joueurs connectés
        </h2>
        <div className="flex flex-col items-center gap-2 w-full">
          {gameState?.players?.map((player) => (
            <p key={player?.id}>{player?.name}</p>
          ))}
        </div>
        {game?.partyOwner?.id === player.id ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <p className="text-neutral-400">
              Vous êtes le propriétaire de la partie
            </p>
            <button
              className="btn btn-primary w-full bg-green-700 hover:bg-green-800"
              onClick={handleStartGame}
              disabled={
                !gameState?.players?.length || gameState?.players?.length < 3
              }
            >
              {!!gameState?.players?.length && gameState?.players?.length < 3
                ? "En attente de joueurs"
                : "Démarrer la partie"}
            </button>
          </div>
        ) : (
          <button onClick={handleJoinParty} className="btn btn-primary w-full">
            {gameState?.players?.length === game?.maxPlayers
              ? "Partie pleine"
              : gameState?.players?.find((p) => p.id === player.id)
              ? "Quitter la partie"
              : "Rejoindre la partie"}
          </button>
        )}
        {game?.error && <p className="text-red-500">{game.error}</p>}
      </div>
    </div>
  );
};

export default JoinParty;
