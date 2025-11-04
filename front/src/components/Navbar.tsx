import { Link } from "react-router-dom";
import { useEffect } from "react";
import getUserFromLocalStorage from "../utils/getUserFromLocalStorage";
import useGetOnlinePlayers from "../hooks/useGetOnlinePlayers";
import config from "../config";

const Navbar = () => {
  const { onlinePlayers, getOnlinePlayers } = useGetOnlinePlayers();

  useEffect(() => {
    getOnlinePlayers();
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center bg-gradient-to-r from-slate-800 via-orange-800/80 to-slate-700 text-white py-4 px-6 w-full shadow-lg border-b border-orange-400/30 backdrop-blur-sm">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-bold">
          <Link to="/lobby" className="text-orange-200 hover:text-orange-100 transition-all duration-200 drop-shadow-sm hover:drop-shadow-md">
            🌴 {config.appName}
          </Link>
        </h2>
        <div className="flex gap-4">
          <Link className="hover:text-orange-300 transition-colors duration-200 font-medium" to="/lobby">
            🏝️ Lobby
          </Link>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        {onlinePlayers !== null ? (
          onlinePlayers > 0 && (
            <h2 className="text-orange-100 font-medium">
              👥 {onlinePlayers} joueur{onlinePlayers > 1 && "s"} en ligne
            </h2>
          )
        ) : (
          <div className="loader" />
        )}
        {getUserFromLocalStorage.playerName && (
          <>
            <span className="text-orange-300/70">|</span>
            <h2 className="text-yellow-100 font-medium flex items-center gap-1">
              <span>🏴‍☠️</span> {getUserFromLocalStorage.playerName}
            </h2>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
