import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Game } from "../types";
import { useSort } from "../utils/useSort";
import { createGame, getGames } from "../services/gameService";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHourglassHalf,
  faKey,
  faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";

export const Lobby = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [formError, setFormError] = useState<string>("");

  const handleCreateParty = async () => {
    const partyName = (document.getElementById("partyName") as HTMLInputElement)
      .value;
    const maxPlayers = (
      document.getElementById("maxPlayers") as HTMLInputElement
    ).value as unknown as number;
    const difficulty = (
      document.getElementById("difficulty") as HTMLInputElement
    ).value as "normal" | "extreme";
    const gameLength = (document.getElementById("length") as HTMLInputElement)
      .value as "normal" | "extended";
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;

    if (!partyName || !maxPlayers || !difficulty || !gameLength) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }

    const gameData = {
      partyName,
      maxPlayers,
      difficulty,
      gameLength,
      password,
    };
    const createdGame = await createGame(gameData);
    const games = await getGames();
    setGames(games);
    // Reset form
    (document.getElementById("partyName") as HTMLInputElement).value = "";
    (document.getElementById("maxPlayers") as HTMLInputElement).value = "4";
    (document.getElementById("difficulty") as HTMLInputElement).value =
      "normal";
    (document.getElementById("length") as HTMLInputElement).value = "normal";
    (document.getElementById("password") as HTMLInputElement).value = "";
    setFormError("");
    // redirect to join game
    window.location.href = "/join/" + createdGame.partyCode;
  };

  useEffect(() => {
    const fetchGames = async () => {
      const games = await getGames();
      setGames(games);
    };

    fetchGames();
  }, []);

  const filteredGames = games.filter(
    (game) =>
      game.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.partyCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { requestSort, items: sortedGames } = useSort<Game>(filteredGames);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col p-4 rounded-lg bg-neutral-700 w-full h-fit">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Mes parties en cours
        </h2>
        {sortedGames
          .filter(
            (game) =>
              game.status !== "finished" &&
              game.players?.find(
                (player) => player?.user.id === localStorage.getItem("playerId")
              )
          )
          .map((game) => (
            <div
              key={game._id}
              className="flex flex-col p-6 rounded-lg bg-neutral-800 w-full mb-4 shadow-lg"
            >
              <h3 className="text-lg font-bold text-white">{game.partyName}</h3>
              <div className="flex gap-6 mt-2 justify-between">
                <div className="flex gap-16">
                  <div className="flex flex-col">
                    <span className="flex items-center text-white">
                      <FontAwesomeIcon icon={faKey} className="mr-2" />
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
                      {game.players?.length} / {game.maxPlayers}
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
                      game.status !== "created" && game.status !== "started"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {game.status === "created" ? "Rejoindre" : "Continuer"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="flex gap-8">
        <div className="flex flex-col p-4 rounded-lg bg-neutral-700 w-full max-w-4xl h-fit">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Rejoindre une partie
          </h2>
          <input
            type="search"
            placeholder="Rechercher une partie par code ou nom"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="w-full max-w-xs mb-8 rounded-md p-2 border border-neutral-500"
          />
          <div
            style={{ maxHeight: "calc(100vh - 300px)" }}
            className="overflow-y-auto"
          >
            <table className="w-full text-white table-fixed">
              <thead className="bg-neutral-800">
                <tr>
                  <th
                    onClick={() => requestSort("private")}
                    className="py-2 sticky top-0 cursor-pointer"
                  >
                    Privée
                  </th>
                  <th
                    onClick={() => requestSort("partyCode")}
                    className="py-2 sticky top-0 cursor-pointer"
                  >
                    Code
                  </th>
                  <th
                    onClick={() => requestSort("name")}
                    className="py-2 sticky top-0 cursor-pointer"
                  >
                    Nom
                  </th>
                  <th
                    onClick={() => requestSort("players")}
                    className="py-2 sticky top-0 cursor-pointer"
                  >
                    Joueurs
                  </th>
                  <th
                    onClick={() => requestSort("difficulty")}
                    className="py-2 sticky top-0 cursor-pointer"
                  >
                    Difficulté
                  </th>
                  <th
                    onClick={() => requestSort("length")}
                    className="py-2 sticky top-0 cursor-pointer"
                  >
                    Durée
                  </th>
                  <th
                    onClick={() => requestSort("players")}
                    className="py-2 sticky top-0 cursor-pointer"
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedGames.map((game) => (
                  <tr key={game._id} className={clsx("hover:bg-neutral-900")}>
                    <td className="border-b border-neutral-500 px-4 py-2">
                      {game.private ? (
                        <span className="text-red-500">Privée</span>
                      ) : (
                        <span className="text-blue-500">Publique</span>
                      )}
                    </td>
                    <td className="border-b border-neutral-500 px-4 py-2">
                      {game.partyCode.toUpperCase()}
                    </td>
                    <td className="border-b border-neutral-500 px-4 py-2 text-left">
                      {game.partyName}
                    </td>
                    <td className="border-b border-neutral-500 px-4 py-2 text-center">
                      {game?.players?.length} / {game.maxPlayers}
                    </td>
                    <td className="border-b border-neutral-500 px-4 py-2">
                      {game.difficulty}
                    </td>
                    <td className="border-b border-neutral-500 px-4 py-2">
                      {game.gameLength}
                    </td>
                    <td className="border-b border-neutral-500 px-4 py-2">
                      {game.players?.length === game.maxPlayers ? (
                        <span className="text-orange-500">Complet</span>
                      ) : game.status === "created" ? (
                        <Link
                          to={`/join/${game.partyCode}`}
                          className="text-green-500 hover:bg-green-900 hover:text-green-300 bg-green-800 p-2 rounded-md"
                        >
                          Rejoindre
                        </Link>
                      ) : game.status === "finished" ? (
                        <span className="text-red-500">Terminée</span>
                      ) : (
                        <span className="text-yellow-500">En cours</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center p-4 rounded-lg bg-neutral-700 w-full max-w-xs h-fit">
          <h2 className="text-2xl font-bold mb-4">Nouvelle partie</h2>
          <input
            id="partyName"
            type="text"
            placeholder="Nom de la partie"
            maxLength={30}
            className="w-full max-w-xs mb-4 p-2 border border-neutral-500 rounded-md"
          />
          <div className="flex w-full gap-4">
            <input
              id="maxPlayers"
              type="number"
              autoComplete="off"
              placeholder="Nombre maximum de joueurs"
              defaultValue={4}
              min={3}
              max={12}
              className="w-full max-w-xs mb-4 p-2 border border-neutral-500 rounded-md"
            />
            <span className="text-sm text-neutral-400">3 à 12 joueurs</span>
          </div>
          <select
            id="difficulty"
            className="select select-bordered select-primary w-full max-w-xs mb-4 p-2 border border-neutral-500 rounded-md"
          >
            <option value={"normal"}>Normal</option>
            <option value={"extreme"}>Extrême</option>
          </select>
          <select
            id="length"
            className="select select-bordered select-primary w-full max-w-xs mb-4 p-2 border border-neutral-500 rounded-md"
          >
            <option value={"normal"}>Normal</option>
            <option value={"extended"}>Extended</option>
          </select>
          <input
            id="password"
            type="password"
            autoComplete="off"
            placeholder="Mot de passe (optionnel)"
            maxLength={30}
            className="w-full max-w-xs mb-4 p-2 border border-neutral-500 rounded-md"
          />
          <button
            onClick={handleCreateParty}
            className="w-full max-w-xs mb-4 py-2 bg-green-500 hover:bg-green-600 hover:shadow-lg hover:text-white text-white text-center rounded-md"
          >
            Créer une Nouvelle Partie
          </button>
          {formError && <p className="text-red-500 mb-4">{formError}</p>}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
