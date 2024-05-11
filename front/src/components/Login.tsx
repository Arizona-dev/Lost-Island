import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import config from "../config";

const Login = () => {
  const [player, setPlayer] = useState("");
  const [error, setError] = useState({ message: "" });
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      if (!player) {
        setError({ message: "Veuillez saisir votre nom" });
        return;
      }

      const userId = uuidv4();

      localStorage.setItem("playerName", player);
      localStorage.setItem("playerId", userId);

      navigate("/lobby");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8 justify-center items-center w-screen h-screen">
      <h1 className="w-full max-w-xs text-justify font-bold mb-4">
        {config.appName}
      </h1>
      <div className="w-full max-w-xs flex flex-col gap-2 items-center">
        <input
          className="w-full p-2 border-2 border-gray-300 rounded-lg"
          type="text"
          placeholder="Votre nom"
          value={player}
          onChange={(e) => setPlayer(e.target.value)}
        />
        {error && <p className="text-red-500 mb-2">{error.message}</p>}
        <button className="w-full bg-green-600" onClick={handleLogin}>
          Commencer
        </button>
      </div>
    </div>
  );
};

export default Login;
