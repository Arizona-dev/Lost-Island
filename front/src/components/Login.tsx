import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../services/authService";

import config from "../config";

const Login = () => {
  const [player, setPlayer] = useState("");
  const [error, setError] = useState({ message: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    try {
      if (!player || player.trim().length === 0) {
        setError({ message: "Veuillez saisir votre nom" });
        return;
      }

      if (player.trim().length > 50) {
        setError({ message: "Le nom doit faire moins de 50 caractères" });
        return;
      }

      setLoading(true);
      setError({ message: "" });

      // Call the auth service to create a session
      await login(player.trim());

      // Check if there's a redirect parameter
      const urlParams = new URLSearchParams(location.search);
      const redirectPath = urlParams.get("redirect");
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate("/lobby");
      }
    } catch (error) {
      console.error(error);
      setError({ message: "Erreur lors de la connexion. Veuillez réessayer." });
    } finally {
      setLoading(false);
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
        <button 
          className="w-full bg-green-600" 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Connexion..." : "Commencer"}
        </button>
      </div>
    </div>
  );
};

export default Login;
