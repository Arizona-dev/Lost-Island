import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const [player, setPlayer] = useState("");
  const [error, setError] = useState<{ message: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const playerName = localStorage.getItem("playerName");
    if (playerName) {
      navigate("/lobby");
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      if (!player) {
        setError({ message: "Veuillez saisir votre nom" });
        return;
      }
      localStorage.setItem("playerName", player);
      navigate("/lobby");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8 justify-center items-center w-screen">
      <h1 className="w-full max-w-xs text-justify font-bold mb-4">
        Galerapagos
      </h1>
      <input
        className="w-full max-w-xs p-2 border-2 border-gray-300 rounded-lg"
        type="text"
        placeholder="Votre nom"
        value={player}
        onChange={(e) => setPlayer(e.target.value)}
      />
      {error && <p className="text-red-500 mb-2">{error.message}</p>}
      <button className="w-full max-w-xs bg-green-600" onClick={handleLogin}>
        Commencer
      </button>
    </div>
  );
};

export default Home;
