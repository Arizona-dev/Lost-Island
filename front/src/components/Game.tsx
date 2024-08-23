import { useEffect, useState } from "react";
import socket from "../socket";
import { Actions, GameSettings, GameState } from "../types";
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
      setGameData({
        ...gameData,
        ...newState,
      });
    });

    return () => {
      socket.off("connect");
      socket.off("GAME_STARTED");
      socket.off("UPDATE_GAME_STATE");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionsDisabled = () => {
    if (
      gameData?.playerIdTurn !== localStorage.getItem("playerId") ||
      gameData?.isVotingActive
    ) {
      return true;
    }
    return false;
  };

  if (!gameSettings || !gameData) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      <img
        src="/assets/island_1.webp"
        alt="ile"
        className="w-full h-full object-cover -z-10 absolute top-0 left-0 filter blur-sm opacity-80"
      />
      <div className="flex w-full h-full">
        <div className="flex flex-col justify-between p-6 w-6/12 gap-6">
          <div className="flex flex-col w-full bg-gray-950 bg-opacity-40 rounded-lg p-4 gap-2 min-w-60">
            <h2 className="text-xl font-bold">🐚 Naufragés</h2>
            <div className="flex flex-wrap gap-4">
              {gameData?.players
                ?.filter(
                  (player) => player.id !== localStorage.getItem("playerId")
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
                    className="flex flex-col items-center space-y-2 cursor-pointer hover:ring-4 hover:ring-blue-500 hover:rounded-lg"
                    onClick={() =>
                      socket.emit("PLAYER_ACTION", {
                        gameId: gameData.id,
                        playerId: localStorage.getItem("playerId"),
                        action_type: Actions.USE_OBJECT,
                        data: {
                          objectId: object.id,
                        },
                      })
                    }
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
                  )?.name
                }
              </div>
            ) : (
              <div className="flex flex-col space-y-4 w-full bg-gray-950 bg-opacity-30 rounded-lg p-4">
                <span className="font-bold">🗳️ Vote en cours</span>
                <div className="flex flex-col gap-2">
                  {gameData?.players?.map((player) => (
                    <div
                      key={player.id + "vote"}
                      className="relative flex bg-gray-950 bg-opacity-30 rounded-lg p-2"
                    >
                      <button
                        onClick={() => {
                          socket.emit("VOTE", {
                            gameId: gameData.id,
                            playerId: localStorage.getItem("playerId"),
                            targetPlayerId: player.id,
                          });
                        }}
                        className="p-0 h-12 w-12 rounded-full hover:ring-4 hover:ring-blue-500 focus:outline-none cursor-pointer"
                        disabled={gameData.voting.some(
                          (vote) => vote.targetPlayerId === player.id
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={`https://i.pravatar.cc/150?u=${player.id}`}
                            alt={player.name}
                            className="h-12 w-12 rounded-full"
                          />

                          <div className="flex flex-col items-start">
                            <span>{player.name}</span>
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
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-950 bg-opacity-30 rounded-lg p-4">
            <div className="w-full gap-2">
              <h2 className="text-xl font-bold">🛠️ Actions</h2>
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
                  className="flex-1 bg-slate-500 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded"
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
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
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
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
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
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded"
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
        </div>
      </div>
    </div>
  );
};

export default Game;
