import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Game, IPlayer } from "../types";
import { useSort } from "../utils/useSort";
import { createGame, getGames } from "../services/gameService";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHourglassHalf,
  faKey,
  faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";

// Helper function to get unique players count from database players
const getUniquePlayersCount = (players: IPlayer[] | undefined): number => {
  if (!players || players.length === 0) return 0;
  const uniquePlayerIds = new Set(
    players.map((p: IPlayer) => p?.user?.id).filter(Boolean)
  );
  return uniquePlayerIds.size;
};

export const Lobby = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [formError, setFormError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [partyName, setPartyName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [voteDuration, setVoteDuration] = useState<number>(60);
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<"normal" | "extreme">("normal");
  const [gameLength, setGameLength] = useState<"normal" | "extended">("normal");
  const [viewMode, setViewMode] = useState<
    "menu" | "create" | "join" | "ongoing"
  >("menu");

  const handleCreateParty = async () => {
    // Validate form
    if (!partyName.trim()) {
      setFormError("Veuillez entrer un nom pour votre camp.");
      return;
    }

    if (partyName.length > 30) {
      setFormError("Le nom du camp ne peut pas dépasser 30 caractères.");
      return;
    }

    setIsCreating(true);
    setFormError("");

    try {
      const gameData = {
        partyName: partyName.trim(),
        maxPlayers,
        difficulty,
        gameLength,
        voteDuration,
        password: password.trim() || undefined,
      };

      const createdGame = await createGame(gameData);
      const games = await getGames();
      setGames(games);

      // Reset form
      setPartyName("");
      setPassword("");
      setMaxPlayers(4);
      setDifficulty("normal");
      setGameLength("normal");
      setVoteDuration(60);
      setFormError("");

      // redirect to join game
      window.location.href = "/join/" + createdGame.partyCode;
    } catch (error) {
      setFormError("Erreur lors de la création du camp. Veuillez réessayer.");
      console.error("Error creating game:", error);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const fetchGames = async () => {
      setIsLoading(true);
      try {
        const games = await getGames();
        setGames(games);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  const filteredGames = games.filter(
    (game) =>
      game.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.partyCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    requestSort,
    items: sortedGames,
    sortConfig,
  } = useSort<Game>(filteredGames);

  // Check if user has ongoing games
  const hasOngoingGames = sortedGames.some(
    (game) =>
      game.status !== "finished" &&
      game.players?.find(
        (player: IPlayer) =>
          player?.user.id === localStorage.getItem("playerId")
      )
  );

  const backToMenu = () => {
    setFormError("");
    setViewMode("menu");
  };

  const handleMenuClick = (mode: "create" | "join" | "ongoing") => {
    setViewMode(mode);
  };

  // Main Menu Component
  const MainMenu = () => (
    <div className="py-12 flex items-center justify-center px-4 relative">
      <div className="text-center max-w-2xl w-full relative z-10">
        {/* Welcome Section */}
        <div className="mb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-2xl">
            Island Exile
          </h1>
          <p className="text-lg md:text-xl text-orange-100 drop-shadow-md font-medium opacity-90">
            Survive together on a deserted island
          </p>
          <div className="flex justify-center items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping"></div>
            <span className="text-xs text-orange-200 font-light">
              Build your raft • Escape the storm
            </span>
            <div
              className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => handleMenuClick("create")}
            className="group relative py-10 px-8 bg-linear-to-br from-amber-800 via-orange-900 to-red-900 hover:from-amber-700 hover:to-red-800 text-white rounded-lg shadow-2xl hover:shadow-red-900/30 transition-all duration-300 border-2 border-amber-600/50 hover:border-amber-400/70 overflow-hidden"
            aria-label="Créer un nouveau camp"
          >
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-600 rounded-full opacity-80"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-orange-700 rounded-full opacity-60"></div>
            <div className="text-5xl mb-4 mt-2 group-hover:animate-bounce origin-bottom">
              🪓
            </div>
            <h3 className="text-2xl font-bold mb-3 drop-shadow-lg">
              Construire votre Camp
            </h3>
            <p className="text-amber-100 text-sm opacity-90">
              Établissez votre camp
            </p>
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent rounded-lg"></div>
          </button>

          <button
            onClick={() => handleMenuClick("join")}
            className="group relative py-10 px-8 bg-linear-to-br from-slate-700 via-stone-800 to-slate-900 hover:from-slate-600 hover:to-stone-800 text-white rounded-lg shadow-2xl hover:shadow-slate-900/30 transition-all duration-300 border-2 border-slate-500/50 hover:border-slate-400/70 overflow-hidden"
            aria-label="Explorer et rejoindre des camps existants"
          >
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-600 rounded-full opacity-70"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-stone-700 rounded-full opacity-50"></div>
            <div className="text-5xl mb-4 mt-2 group-hover:animate-bounce origin-bottom">
              🧭
            </div>
            <h3 className="text-2xl font-bold mb-3 drop-shadow-lg">Explorer</h3>
            <p className="text-slate-100 text-sm opacity-90">
              Rejoignez d'autres survivants
            </p>
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent rounded-lg"></div>
          </button>
        </div>

        {/* Ongoing Games Button */}
        {hasOngoingGames && (
          <button
            onClick={() => handleMenuClick("ongoing")}
            className="group relative py-8 px-6 bg-linear-to-br from-yellow-900 via-amber-800 to-orange-900 hover:from-yellow-800 hover:to-amber-800 text-white rounded-lg shadow-2xl hover:shadow-orange-900/30 transition-all duration-300 border-2 border-yellow-600/50 hover:border-yellow-400/70 overflow-hidden"
            aria-label="Retourner aux parties en cours"
          >
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-yellow-600 rounded-full opacity-75"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-700 rounded-full opacity-60"></div>
            <div className="text-4xl mb-3 mt-1 group-hover:animate-pulse origin-center">
              🏕️
            </div>
            <h3 className="text-xl font-bold mb-2 drop-shadow-lg">
              Retour au Camp
            </h3>
            <p className="text-yellow-100 text-sm opacity-90">
              Reprenez votre survie
            </p>
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent rounded-lg"></div>
          </button>
        )}
      </div>
    </div>
  );

  // Render different views based on mode
  const renderContent = () => {
    if (viewMode === "menu") {
      return (
        <div className="relative z-10 min-h-full flex flex-col">
          <MainMenu />
        </div>
      );
    }

    return (
      <div className="relative z-10 min-h-full flex flex-col items-center justify-center p-4">
        {/* Content area */}
        <div className="w-full max-w-6xl">
          <div className="flex flex-col gap-8 pb-8">
            {/* Ongoing Games Section */}
            {viewMode === "ongoing" && (
              <div className="flex flex-col p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl w-full h-fit hover:bg-white/15 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white group-hover:text-cyan-100 transition-colors duration-300">
                    Mes parties en cours
                  </h2>
                  <button
                    onClick={backToMenu}
                    className="group flex items-center gap-2 px-3 py-2 bg-linear-to-r from-slate-800 to-stone-800 hover:from-slate-700 hover:to-stone-700 backdrop-blur-sm border-2 border-slate-600/50 hover:border-slate-500/70 rounded-lg text-white transition-all duration-200 hover:scale-105 shadow-lg text-sm"
                    aria-label="Retour au menu principal"
                  >
                    <span className="text-base group-hover:-translate-x-1 transition-transform duration-200">
                      🏕️
                    </span>
                    <span className="font-medium">Retour</span>
                  </button>
                </div>
                {sortedGames.filter(
                  (game) =>
                    game.status !== "finished" &&
                    game.players?.find(
                      (player: IPlayer) =>
                        player?.user.id === localStorage.getItem("playerId")
                    )
                ).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-6xl mb-4 opacity-50">🏕️</div>
                    <p className="text-white/70 text-lg">
                      Aucune partie en cours
                    </p>
                  </div>
                ) : (
                  sortedGames
                    .filter(
                      (game) =>
                        game.status !== "finished" &&
                        game.players?.find(
                          (player: IPlayer) =>
                            player?.user.id === localStorage.getItem("playerId")
                        )
                    )
                    .map((game) => (
                      <div
                        key={game._id}
                        className="flex flex-col p-6 rounded-xl bg-white/15 backdrop-blur-sm border border-white/10 w-full mb-4 shadow-2xl hover:bg-white/20 transition-all duration-300"
                      >
                        <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">
                          {game.partyName}
                        </h3>
                        <div className="flex gap-6 mt-2 justify-between">
                          <div className="flex gap-16">
                            <div className="flex flex-col">
                              <span className="flex items-center text-white">
                                <FontAwesomeIcon
                                  icon={faKey}
                                  className="mr-2"
                                />
                                Code: {game.partyCode}
                              </span>
                              <span className="flex items-center text-white">
                                <FontAwesomeIcon
                                  icon={faTachometerAlt}
                                  className="mr-2"
                                />
                                Difficulté: {game.difficulty}
                              </span>
                              <span className="flex items-center text-white">
                                <FontAwesomeIcon
                                  icon={faHourglassHalf}
                                  className="mr-2"
                                />
                                Durée: {game.gameLength}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="flex items-center text-white">
                                <i className="fas fa-users mr-2"></i>Joueurs:{" "}
                                {getUniquePlayersCount(game.players)} /{" "}
                                {game.maxPlayers}
                              </span>
                              <span
                                className={`ml-2 rounded-full px-3 py-1 text-xs font-bold ${
                                  game.status === "created"
                                    ? "bg-yellow-500"
                                    : game.status === "started"
                                    ? "bg-blue-500"
                                    : "bg-gray-500"
                                }`}
                              >
                                {game.status === "created"
                                  ? "Dans le lobby"
                                  : game.status === "started"
                                  ? "En cours"
                                  : "Terminée"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <Link
                              to={
                                game.status === "created"
                                  ? `/join/${game.partyCode}`
                                  : `/game/${game.partyCode}`
                              }
                              className={`text-white hover:bg-blue-900 bg-blue-800 p-2 rounded-lg transition-colors duration-300 ${
                                game.status !== "created" &&
                                game.status !== "started"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {game.status === "created"
                                ? "Rejoindre"
                                : "Continuer"}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* Join Games Section */}
            {viewMode === "join" && (
              <div className="flex flex-col p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl w-full max-w-4xl h-fit hover:bg-white/15 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white group-hover:text-cyan-100 transition-colors duration-300">
                    Rejoindre une partie
                  </h2>
                  <button
                    onClick={backToMenu}
                    className="group flex items-center gap-2 px-3 py-2 bg-linear-to-r from-slate-800 to-stone-800 hover:from-slate-700 hover:to-stone-700 backdrop-blur-sm border-2 border-slate-600/50 hover:border-slate-500/70 rounded-lg text-white transition-all duration-200 hover:scale-105 shadow-lg text-sm"
                    aria-label="Retour au menu"
                  >
                    <span className="text-base group-hover:-translate-x-1 transition-transform duration-200">
                      🏕️
                    </span>
                    <span className="font-medium">Retour</span>
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-white/70">Chargement des parties...</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="search"
                      placeholder="Rechercher une partie par code ou nom"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoComplete="off"
                      className="w-full max-w-xs mb-8 rounded-lg p-3 bg-white/20 border border-white/30 text-white placeholder-blue-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                      aria-label="Rechercher une partie"
                    />
                    {sortedGames.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="text-6xl mb-4 opacity-50">🏝️</div>
                        <p className="text-white/70 text-lg mb-2">
                          {searchTerm
                            ? "Aucune partie trouvée"
                            : "Aucune partie disponible"}
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="text-blue-300 hover:text-blue-200 underline text-sm mt-2"
                          >
                            Effacer la recherche
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-white table-fixed">
                          <thead className="bg-white/20 backdrop-blur-sm">
                            <tr>
                              <th
                                onClick={() => requestSort("private")}
                                className="py-2 sticky top-0 cursor-pointer hover:bg-white/30 transition-colors select-none"
                                role="button"
                                aria-label="Trier par statut privé"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    requestSort("private");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  Privée
                                  {sortConfig.key === "private" && (
                                    <span className="text-xs">
                                      {sortConfig.direction === "ascending"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                onClick={() => requestSort("partyCode")}
                                className="py-2 sticky top-0 cursor-pointer hover:bg-white/30 transition-colors select-none"
                                role="button"
                                aria-label="Trier par code"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    requestSort("partyCode");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  Code
                                  {sortConfig.key === "partyCode" && (
                                    <span className="text-xs">
                                      {sortConfig.direction === "ascending"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                onClick={() => requestSort("partyName")}
                                className="py-2 sticky top-0 cursor-pointer hover:bg-white/30 transition-colors select-none"
                                role="button"
                                aria-label="Trier par nom"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    requestSort("partyName");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  Nom
                                  {sortConfig.key === "partyName" && (
                                    <span className="text-xs">
                                      {sortConfig.direction === "ascending"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                onClick={() => requestSort("players")}
                                className="py-2 sticky top-0 cursor-pointer hover:bg-white/30 transition-colors select-none"
                                role="button"
                                aria-label="Trier par nombre de joueurs"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    requestSort("players");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  Joueurs
                                  {sortConfig.key === "players" && (
                                    <span className="text-xs">
                                      {sortConfig.direction === "ascending"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                onClick={() => requestSort("difficulty")}
                                className="py-2 sticky top-0 cursor-pointer hover:bg-white/30 transition-colors select-none"
                                role="button"
                                aria-label="Trier par difficulté"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    requestSort("difficulty");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  Difficulté
                                  {sortConfig.key === "difficulty" && (
                                    <span className="text-xs">
                                      {sortConfig.direction === "ascending"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                onClick={() => requestSort("gameLength")}
                                className="py-2 sticky top-0 cursor-pointer hover:bg-white/30 transition-colors select-none hidden md:table-cell"
                                role="button"
                                aria-label="Trier par durée"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    requestSort("gameLength");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  Durée
                                  {sortConfig.key === "gameLength" && (
                                    <span className="text-xs">
                                      {sortConfig.direction === "ascending"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                onClick={() => requestSort("status")}
                                className="py-2 sticky top-0 cursor-pointer hover:bg-white/30 transition-colors select-none"
                                role="button"
                                aria-label="Trier par statut"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    requestSort("status");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  Status
                                  {sortConfig.key === "status" && (
                                    <span className="text-xs">
                                      {sortConfig.direction === "ascending"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {sortedGames.map((game) => (
                              <tr
                                key={game._id}
                                className={clsx(
                                  "hover:bg-white/10 transition-colors duration-200"
                                )}
                              >
                                <td className="border-b border-white/20 px-4 py-3">
                                  {game.private ? (
                                    <span className="text-red-500">Privée</span>
                                  ) : (
                                    <span className="text-blue-500">
                                      Publique
                                    </span>
                                  )}
                                </td>
                                <td className="border-b border-white/20 px-4 py-3 font-mono text-sm">
                                  {game.partyCode.toUpperCase()}
                                </td>
                                <td className="border-b border-white/20 px-4 py-3 text-left truncate">
                                  <span
                                    className="block truncate"
                                    title={game.partyName}
                                  >
                                    {game.partyName}
                                  </span>
                                </td>
                                <td className="border-b border-white/20 px-4 py-3 text-center">
                                  {getUniquePlayersCount(game?.players)} /{" "}
                                  {game.maxPlayers}
                                </td>
                                <td className="border-b border-white/20 px-4 py-3 capitalize">
                                  {game.difficulty === "normal"
                                    ? "🌿 Normal"
                                    : "🔥 Extrême"}
                                </td>
                                <td className="border-b border-white/20 px-4 py-3 hidden md:table-cell capitalize">
                                  {game.gameLength === "normal"
                                    ? "🌅 Normal"
                                    : "🌙 Étendue"}
                                </td>
                                <td className="border-b border-white/20 px-4 py-3">
                                  {(() => {
                                    const playerCount = getUniquePlayersCount(
                                      game.players
                                    );
                                    const isFull =
                                      playerCount === game.maxPlayers;

                                    if (game.status === "started") {
                                      return (
                                        <span className="text-yellow-400 drop-shadow-sm">
                                          En cours
                                        </span>
                                      );
                                    } else if (
                                      isFull &&
                                      game.status !== "finished"
                                    ) {
                                      return (
                                        <span className="text-orange-400 drop-shadow-sm">
                                          Complet
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <Link
                                          to={`/join/${game.partyCode}`}
                                          className="text-green-400 hover:bg-green-600 hover:text-white bg-green-700 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-block"
                                          aria-label={`Rejoindre la partie ${game.partyName}`}
                                        >
                                          Ouvrir
                                        </Link>
                                      );
                                    }
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Create Game Section */}
            {viewMode === "create" && (
              <div className="flex flex-col w-full max-w-4xl h-fit">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                      🪓 Forgez Votre Destin
                    </h2>
                    <p className="text-amber-100 text-sm opacity-90">
                      Configurez les règles de survie de votre colonie
                    </p>
                  </div>
                  <button
                    onClick={backToMenu}
                    className="group flex items-center gap-2 px-3 py-2 bg-linear-to-r from-slate-800 to-stone-800 hover:from-slate-700 hover:to-stone-700 backdrop-blur-sm border-2 border-slate-600/50 hover:border-slate-500/70 rounded-lg text-white transition-all duration-200 hover:scale-105 shadow-lg text-sm"
                    aria-label="Retour au menu principal"
                  >
                    <span className="text-base group-hover:-translate-x-1 transition-transform duration-200">
                      🏕️
                    </span>
                    <span className="font-medium">Retour</span>
                  </button>
                </div>

                {/* Content Container */}
                <div className="flex flex-col items-center">
                  <form
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateParty();
                    }}
                    className="w-full"
                  >
                    {/* Hidden fake fields to trick browsers */}
                    <input
                      type="text"
                      name="fake_field_1"
                      autoComplete="off"
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <input
                      type="password"
                      name="fake_field_2"
                      autoComplete="off"
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
                      {/* Camp Basics */}
                      <div className="bg-linear-to-br from-slate-800/40 to-slate-700/30 p-4 rounded-lg border border-slate-600/30 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-xl">🏕️</div>
                          <h3 className="text-base font-bold text-slate-100">
                            Bases du Camp
                          </h3>
                        </div>

                        {/* Camp Name */}
                        <div className="mb-3">
                          <label
                            htmlFor="partyName"
                            className="block text-sm font-medium text-slate-200 mb-2"
                          >
                            Nom du Camp
                          </label>
                           <input
                             id="partyName"
                             type="text"
                             placeholder="Ex: Refuge des Naufragés"
                             maxLength={30}
                             value={partyName}
                             onChange={(e) => {
                               setPartyName(e.target.value);
                               if (formError) setFormError("");
                             }}
                             className="w-full p-2 bg-slate-800/60 border border-slate-600/40 rounded-lg text-white placeholder-slate-400/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200"
                             aria-label="Nom du camp"
                             aria-describedby="partyName-error"
                             autoComplete="off"
                             data-lpignore="true"
                             data-form-type="other"
                             name={`party-name-${Math.random()}`}
                           />
                          <div className="text-xs text-slate-100/70 mt-1 text-right">
                            {partyName.length}/30 caractères
                          </div>
                        </div>

                        {/* Player Count */}
                        <div>
                          <label
                            htmlFor="maxPlayers"
                            className="block text-sm font-medium text-slate-200 mb-2"
                          >
                            Nombre de survivants
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              id="maxPlayers"
                              type="range"
                              min={3}
                              max={12}
                              step={1}
                              value={maxPlayers}
                              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                              style={{
                                background: `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${
                                  ((maxPlayers - 3) / (12 - 3)) * 100
                                }%, #64748b ${
                                  ((maxPlayers - 3) / (12 - 3)) * 100
                                }%, #64748b 100%)`,
                              }}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setMaxPlayers(value);
                              }}
                              aria-label={`Taille de la colonie: ${maxPlayers} survivants`}
                            />
                            <div className="flex items-center gap-1 min-w-[60px]">
                              <span className="text-lg font-bold text-slate-200">
                                {maxPlayers}
                              </span>
                              <span className="text-sm text-slate-100">
                                survivants
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-200/70 mt-1">
                            <span>3</span>
                            <span>12</span>
                          </div>
                        </div>
                      </div>

                      {/* Survival Difficulty */}
                      <div className="bg-linear-to-br from-slate-800/35 to-slate-700/25 p-4 rounded-lg border border-slate-600/25 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-xl">⚔️</div>
                          <h3 className="text-base font-bold text-slate-100">
                            Défi de Survie
                          </h3>
                        </div>

                        <div>
                          <label
                            htmlFor="difficulty"
                            className="block text-sm font-medium text-slate-200 mb-2"
                          >
                            Niveau de Difficulté
                          </label>
                          <div className="relative">
                            <div className="flex gap-2">
                               <button
                                 type="button"
                                 onClick={() => setDifficulty("normal")}
                                 className={`rounded-md py-1 px-2 text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                                   difficulty === "normal"
                                     ? "bg-slate-300 text-green-500 shadow-md border border-slate-400"
                                     : "text-slate-100 hover:text-white bg-slate-600/60 hover:bg-slate-500/70 border border-transparent"
                                 }`}
                                 aria-label="Niveau de difficulté normal"
                                 aria-pressed={difficulty === "normal"}
                               >
                                 🌿 Normal
                               </button>
                               <button
                                 type="button"
                                 onClick={() => setDifficulty("extreme")}
                                 className={`rounded-md py-1 px-2 text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                                   difficulty === "extreme"
                                     ? "bg-slate-300 text-red-500 shadow-md border border-slate-400"
                                     : "text-slate-100 hover:text-white bg-slate-600/60 hover:bg-slate-500/70 border border-transparent"
                                 }`}
                                 aria-label="Niveau de difficulté extrême"
                                 aria-pressed={difficulty === "extreme"}
                               >
                                 🔥 Extrême
                               </button>
                            </div>
                            <div className="mt-2 text-center">
                              <p className="text-xs text-slate-200/70">
                                {difficulty === "normal"
                                  ? "🌿 Survie équilibrée"
                                  : "⚠️ Ressources réduites, menaces accrues"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Game Duration */}
                      <div className="bg-linear-to-br from-slate-800/30 to-slate-700/20 p-4 rounded-lg border border-slate-600/20 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-xl">⏱️</div>
                          <h3 className="text-base font-bold text-slate-100">
                            Durée de la Tempête
                          </h3>
                        </div>

                        <div>
                          <label
                            htmlFor="gameLength"
                            className="block text-sm font-medium text-slate-200 mb-2"
                          >
                            Longueur de Partie
                          </label>
                          <div className="relative">
                            <div className="flex gap-2">
                               <button
                                 type="button"
                                 onClick={() => setGameLength("normal")}
                                 className={`rounded-md py-1 px-2 text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                                   gameLength === "normal"
                                     ? "bg-slate-300 text-green-500 shadow-md border border-slate-400"
                                     : "text-slate-100 hover:text-white bg-slate-600/60 hover:bg-slate-500/70 border border-transparent"
                                 }`}
                                 aria-label="Durée de partie normale (15-25 minutes)"
                                 aria-pressed={gameLength === "normal"}
                               >
                                 🌅 Normal
                               </button>
                               <button
                                 type="button"
                                 onClick={() => setGameLength("extended")}
                                 className={`rounded-md py-1 px-2 text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                                   gameLength === "extended"
                                     ? "bg-slate-300 text-yellow-500 shadow-md border border-slate-400"
                                     : "text-slate-100 hover:text-white bg-slate-600/60 hover:bg-slate-500/70 border border-transparent"
                                 }`}
                                 aria-label="Durée de partie étendue (25-40 minutes)"
                                 aria-pressed={gameLength === "extended"}
                               >
                                 🌙 Étendue
                               </button>
                            </div>
                            <div className="mt-2 text-center">
                              <p className="text-xs text-slate-200/70">
                                {gameLength === "normal"
                                  ? "🌅 15-25 minutes"
                                  : "🌙 25-40 minutes"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Voting & Security */}
                      <div className="bg-linear-to-br from-slate-800/20 to-slate-700/10 p-4 rounded-lg border border-slate-600/10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-xl">🗳️</div>
                          <h3 className="text-base font-bold text-slate-100">
                            Démocratie & Sécurité
                          </h3>
                        </div>

                        {/* Vote Duration */}
                        <div className="mb-3">
                          <label
                            htmlFor="voteDuration"
                            className="block text-sm font-medium text-slate-200 mb-2"
                          >
                            Durée des Votes
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              id="voteDuration"
                              type="range"
                              min={20}
                              max={120}
                              step={5}
                              value={voteDuration}
                              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                              style={{
                                background: `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${
                                  ((voteDuration - 20) / (120 - 20)) * 100
                                }%, #64748b ${
                                  ((voteDuration - 20) / (120 - 20)) * 100
                                }%, #64748b 100%)`,
                              }}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setVoteDuration(value);
                              }}
                              aria-label={`Durée des votes: ${voteDuration} secondes`}
                            />
                            <div className="flex items-center gap-2 min-w-[60px]">
                              <span className="text-lg font-bold text-slate-200">
                                {voteDuration}
                              </span>
                              <span className="text-sm text-slate-100">
                                sec
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-300/80 mt-1">
                            <span>20s</span>
                            <span>2min</span>
                          </div>
                        </div>

                         {/* Password Protection */}
                         <div>
                           <label
                             htmlFor="password"
                             className="block text-sm font-medium text-slate-200 mb-2"
                           >
                             Protection du Camp
                           </label>
                           <div className="relative">
                             <input
                               id="password"
                               type={showPassword ? "text" : "password"}
                               placeholder="Mot de passe (optionnel)"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                               className="w-full p-2 pr-9 bg-slate-800/60 border border-slate-600/40 rounded-lg text-white placeholder-slate-400/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200"
                               aria-label="Mot de passe pour protéger le camp (optionnel)"
                               autoComplete="off"
                               data-1p-ignore
                               data-bwignore
                               data-lpignore="true"
                               data-form-type="other"
                               name={`field-${Date.now()}-${Math.random()}`}
                             />
                             <button
                               type="button"
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded transition-all duration-200 text-xs"
                               aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                               tabIndex={-1}
                             >
                               {showPassword ? "🙈" : "👁️"}
                             </button>
                           </div>
                           <p className="text-xs text-slate-400/60 mt-1 flex items-center gap-1">
                             <span>🔒</span>
                             <span>Protège votre colonie</span>
                           </p>
                         </div>
                      </div>
                    </div>

                    {/* Create Button */}
                    <button
                      onClick={handleCreateParty}
                      className="group relative px-6 py-3 bg-linear-to-r from-slate-800 via-stone-800 to-slate-900 hover:from-slate-700 hover:to-stone-700 text-white font-bold text-base rounded-lg shadow-2xl hover:shadow-slate-900/30 transition-all duration-300 transform hover:scale-105 border-2 border-slate-500/50 hover:border-slate-400/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full"
                      disabled={isCreating || !partyName.trim()}
                      aria-label="Construire votre camp"
                      type="submit"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isCreating ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>Construction en cours...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg group-hover:animate-bounce">
                              🪓
                            </span>
                            <span>Construire votre camp</span>
                          </>
                        )}
                      </div>
                    </button>

                    {formError && (
                      <div
                        className="mt-3 p-3 bg-red-900/40 border-2 border-red-600/50 rounded-lg animate-fade-in"
                        role="alert"
                        aria-live="polite"
                      >
                        <p className="text-red-200 text-sm font-medium drop-shadow-sm flex items-center gap-2">
                          <span>⚠️</span>
                          <span>{formError}</span>
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Fixed Background Layer */}
      <div className="fixed top-14 left-0 right-0 bottom-0 bg-linear-to-br from-slate-800 via-orange-800/60 to-slate-900/90">
        {/* Background overlay with island image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url(/assets/island_1.webp)" }}
        />

        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating palm leaves and island elements */}
          <div
            className="absolute top-16 left-10 animate-bounce"
            style={{ animationDuration: "4s", animationDelay: "0s" }}
          >
            <div className="text-4xl opacity-30">🌴</div>
          </div>
          <div
            className="absolute top-24 right-16 animate-bounce"
            style={{ animationDuration: "5s", animationDelay: "1s" }}
          >
            <div className="text-3xl opacity-25">🍃</div>
          </div>
          <div
            className="absolute top-32 left-1/4 animate-bounce"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          >
            <div className="text-2xl opacity-20">🌿</div>
          </div>
          <div
            className="absolute top-12 right-1/4 animate-pulse"
            style={{ animationDuration: "7s", animationDelay: "3s" }}
          >
            <div className="text-2xl opacity-15">🏝️</div>
          </div>

          {/* Flying seagulls */}
          <div
            className="absolute top-24 left-1/2 animate-ping"
            style={{ animationDuration: "8s", animationDelay: "2s" }}
          >
            <div className="text-lg opacity-20">🦅</div>
          </div>
          <div
            className="absolute top-28 right-8 animate-ping"
            style={{ animationDuration: "6s", animationDelay: "4s" }}
          >
            <div className="text-sm opacity-25">🐦</div>
          </div>

          {/* Floating bubbles/particles */}
          <div
            className="absolute bottom-40 left-20 animate-pulse"
            style={{ animationDuration: "3s" }}
          >
            <div className="w-2 h-2 bg-orange-200/40 rounded-full"></div>
          </div>
          <div
            className="absolute bottom-60 right-32 animate-pulse"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          >
            <div className="w-1 h-1 bg-purple-200/30 rounded-full"></div>
          </div>
          <div
            className="absolute bottom-80 left-1/3 animate-pulse"
            style={{ animationDuration: "5s", animationDelay: "2s" }}
          >
            <div className="w-1.5 h-1.5 bg-yellow-200/35 rounded-full"></div>
          </div>
        </div>

        {/* Ocean wave effect with animation */}
        <div className="absolute inset-0">
          <div
            className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-slate-900/40 to-transparent opacity-50 animate-pulse"
            style={{ animationDuration: "8s" }}
          ></div>
          <div
            className="absolute bottom-0 left-0 w-full h-16 bg-linear-to-t from-orange-800/30 to-transparent opacity-30 animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "1s" }}
          ></div>

          {/* Animated wave pattern */}
          <div
            className="absolute bottom-0 left-0 w-full h-8 bg-linear-to-r from-transparent via-orange-700/15 to-transparent animate-pulse"
            style={{ animationDuration: "4s" }}
          ></div>
        </div>
      </div>

      {/* Scrollable Content Layer */}
      <div className="relative z-10 overflow-y-auto">
        {/* Content with transition animation */}
        <div key={viewMode} className="relative z-10 animate-fade-in">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default Lobby;
