import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Login from "./Login";
import { useEffect, useState } from "react";

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    } else {
      setLoggedIn(false);
      // Only redirect to login page if not already there
      if (location.pathname !== "/") {
        const currentPath = location.pathname + location.search;
        navigate(`/?redirect=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [navigate, location]);

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
    <div className="flex flex-col items-center w-screen min-h-screen">
      <Navbar />
      {!loggedIn && <Login />}
      <div className="mt-16 w-full flex justify-center items-center">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
