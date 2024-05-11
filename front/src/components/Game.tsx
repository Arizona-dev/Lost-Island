import { useEffect, useState } from "react";
import socket from "../socket";
import { GameSettings, GameState } from "../types";
import { getGame } from "../services/gameService";

const Game = () => {
  const gameCode = window.location.pathname.split("/").pop();
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [gameData, setGameData] = useState<GameState | null>(null);

  enum weatherList {
    "Rainy" = "🌧️ Pluvieux",
    "Sunny" = "☀️ Ensoleillé",
    "Stormy" = "🌩️ Orageux",
    "Hurricane" = "🌀 Ouragan",
  }

  useEffect(() => {
    document.title = "Partie en cours";
    const fetchGame = async () => {
      try {
        if (!gameCode) {
          return;
        }
        const gameResponse = await getGame(gameCode);
        setGameSettings(gameResponse);
      } catch (error) {
        console.log(error);
      }
    };

    fetchGame();
  }, [gameCode]);

  useEffect(() => {
    socket.emit("PLAYER_JOINED", {
      gameId: gameSettings?._id,
      playerId: localStorage.getItem("playerId"),
      playerName: localStorage.getItem("playerName"),
    });

    socket.on("error", (error) => {
      console.error(error);
    });

    socket.on("GAME_STARTED", (gameState) => {
      console.log("GAME_STARTED reçu du serveur", gameState);
      setGameData(gameState);
      // TODO : Afficher un message de confirmation
    });

    socket.on("UPDATE_GAME_STATE", (gameState) => {
      console.log("UPDATE_GAME_STATE reçu du serveur", gameState);
      setGameData(gameState);
    });

    return () => {
      socket.off("GAME_STARTED");
      socket.off("UPDATE_GAME_STATE");
    };
  }, [gameSettings]);

  return (
    <div className="flex flex-col items-center w-full h-full">
      <img
        src="/assets/island_1.webp"
        alt="ile"
        className="w-full h-full object-cover -z-10 absolute top-0 left-0 filter blur-sm opacity-80"
      />
      <div className="flex w-full h-full">
        <div className="h-full w-4/12 p-6">
          <div className="flex flex-col w-full bg-gray-950 bg-opacity-40 rounded-lg p-4 gap-2">
            <h2 className="text-xl font-bold">☀️ Jour : {gameData?.day}</h2>
            <div className="flex items-center space-x-2 text-xl">
              <span>🐟</span>
              <span className="font-semibold">
                Nourriture {gameData?.resourceIndicators?.food}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xl">
              <span>💧</span>
              <span className="font-semibold">
                Eau {gameData?.resourceIndicators?.water}
              </span>
            </div>
            <hr className="border-neutral-700 my-2" />
            <div className="flex space-x-4 mb-4">
              {gameData?.players.map((player) => (
                <div key={player.id} className="flex items-center space-x-2">
                  <div className="h-12 w-12 bg-gray-950 bg-opacity-30 rounded-full">
                    <img
                      src={`https://i.pravatar.cc/150?u=${player.id}`}
                      alt={player.name}
                      className="h-12 w-12 rounded-full"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span>{player.name}</span>
                    <span>
                      {player.status === "dead"
                        ? "💀"
                        : player.status === "sick"
                        ? "🤒"
                        : "😀"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between h-full w-8/12 p-6">
          <div className="flex justify-between items-center w-full h-20 bg-gray-950 bg-opacity-30 rounded-lg p-4">
            <h1 className="text-2xl font-bold">☀️ Jour {gameData?.day}</h1>
            <div className="flex flex-col items-center gap-2 text-[#8ecaff]">
              <span className="font-medium">
                {
                  weatherList[
                    gameData?.weatherList[0]
                      .description as keyof typeof weatherList
                  ]
                }{" "}
              </span>
              💧 Humidité {gameData?.weatherList[0].water}
            </div>
          </div>
          <div className="w-full bg-gray-950 bg-opacity-30 rounded-lg p-4">
            Au tour de{" "}
            {
              gameData?.players.find(
                (player) => player.id === gameData.playerIdTurn
              )?.name
            }
          </div>

          <button
            onClick={() =>
              socket.emit("GAME_STARTED", { gameId: gameSettings?._id })
            }
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded"
          >
            🚀 Commencer la partie
          </button>

          <button
            onClick={() =>
              socket.emit("RESET_GAME", { gameId: gameSettings?._id })
            }
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
          >
            🗑️ Supprimer la partie
          </button>

          <div className="w-full bg-gray-950 bg-opacity-30 rounded-lg p-4">
            <div className="flex w-full space-x-4">
              <button
                onClick={() => socket.emit("scavenge")}
                className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded"
              >
                🤿 Fouiller l'épave
              </button>
              <button
                onClick={() => socket.emit("hunt")}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
              >
                🎣 Pêcher
              </button>
              <button
                onClick={() => socket.emit("drink")}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
              >
                🚰 Récupérer de l'eau
              </button>
            </div>
          </div>
        </div>
        <div className="h-full w-2/12 p-6"></div>
      </div>
    </div>
  );
};

export default Game;
