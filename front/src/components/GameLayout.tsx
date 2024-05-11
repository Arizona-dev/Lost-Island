import { Outlet, useNavigate } from "react-router-dom";
import Login from "./Login";
import { useEffect, useState } from "react";
import GameNavbar from "./GameNavbar";

export const GameLayout = () => {
  const navigate = useNavigate();
  const playerName = localStorage.getItem("playerName");
  const playerId = localStorage.getItem("playerId");

  const [loggedIn, setLoggedIn] = useState<boolean>(
    playerName && playerId ? true : false
  );

  useEffect(() => {
    const playerName = localStorage.getItem("playerName");
    const playerId = localStorage.getItem("playerId");

    if (playerName && playerId) {
      setLoggedIn(true);
      if (window.location.pathname === "/") {
        navigate("/lobby");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const syncLoginState = () => {
      const playerName = localStorage.getItem("playerName");
      const playerId = localStorage.getItem("playerId");
      navigate("/");
      setLoggedIn(!!(playerName && playerId));
    };

    window.addEventListener("storage", syncLoginState);

    return () => {
      window.removeEventListener("storage", syncLoginState);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center w-screen h-screen">
      <GameNavbar />
      {!loggedIn && <Login />}
      <Outlet />
    </div>
  );
};

export default GameLayout;
