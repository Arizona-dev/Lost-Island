import { Link } from "react-router-dom";
import getUserFromLocalStorage from "../utils/getUserFromLocalStorage";
import useGetOnlinePlayers from "../hooks/useGetOnlinePlayers";
import config from "../config";

const Navbar = () => {
  const { onlinePlayers, getOnlinePlayers } = useGetOnlinePlayers();

  getOnlinePlayers();

  return (
    <div className="flex justify-between items-center bg-slate-900 text-white py-4 px-6 w-full">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-bold">
          <Link to="/lobby" className="text-orange-400 hover:text-orange-500">
            {config.appName}
          </Link>
        </h2>
        <div className="flex gap-4">
          <Link className="hover:underline" to="/lobby">
            Lobby
          </Link>
        </div>
      </div>
      <div className="flex gap-4">
        {!!onlinePlayers && onlinePlayers > 0 && (
          <h2>
            {onlinePlayers} joueur{onlinePlayers > 1 && "s"} en ligne
          </h2>
        )}
        {!onlinePlayers && <div className="loader" />}
        {getUserFromLocalStorage.playerName && (
          <>
            |<h2>{getUserFromLocalStorage.playerName}</h2>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
