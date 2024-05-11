import { Link } from "react-router-dom";

import getUserFromLocalStorage from "../utils/getUserFromLocalStorage";

import config from "../config";
import { useEffect, useState } from "react";
import { Game } from "../types";
import { getGame } from "../services/gameService";

const GameNavbar = () => {
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const code = window.location.pathname.split("/").pop();
        if (!code) {
          return;
        }
        const gameResponse = await getGame(code);
        setGame(gameResponse);
      } catch (error) {
        console.log(error);
      }
    };

    fetchGame();
  }, []);

  return (
    <div className="flex justify-between items-center bg-slate-900 text-white py-4 px-6 w-full">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-bold">
          <Link to="/lobby" className="text-orange-400 hover:text-orange-500">
            {config.appName}
          </Link>
        </h2>
        <div className="flex gap-4">
          {game?.partyName && <h2>{game.partyName}</h2>}
        </div>
      </div>
      <div className="flex gap-4">
        {getUserFromLocalStorage.playerName && (
          <h2>{getUserFromLocalStorage.playerName}</h2>
        )}
      </div>
    </div>
  );
};

export default GameNavbar;
