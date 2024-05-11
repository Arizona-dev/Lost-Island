import { useState } from "react";
import { createGame } from "../services/gameService";
import { useNavigate } from "react-router-dom";

const CreateParty = () => {
  const [partyName, setPartyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [difficulty, setDifficulty] = useState<"normal" | "extreme">("normal");
  const [gameLength, setGameLength] = useState<"normal" | "extended">("normal");
  const navigate = useNavigate();

  const handleCreateParty = async () => {
    const partyDetails = {
      partyName,
      maxPlayers,
      difficulty,
      gameLength,
    };

    try {
      const response = await createGame(partyDetails);
      console.log("Party created successfully:", response.data);
      // Gérez ici la réussite de la création, par exemple en redirigeant l'utilisateur vers le lobby de la partie
      localStorage.setItem("partyId", response.data._id);
      navigate(`/lobby/${response.data._id}`);
    } catch (error) {
      console.error("Failed to create party:", error);
      // Gérez ici les erreurs, par exemple en affichant un message d'erreur à l'utilisateur
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Créer une Nouvelle Partie</h2>
      <input
        type="text"
        placeholder="Nom de la partie"
        value={partyName}
        onChange={(e) => setPartyName(e.target.value)}
        className="input input-bordered input-primary w-full max-w-xs mb-4"
      />
      <input
        type="number"
        placeholder="Nombre maximum de joueurs"
        value={maxPlayers}
        onChange={(e) => setMaxPlayers(Number(e.target.value))}
        className="input input-bordered input-primary w-full max-w-xs mb-4"
      />
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value as "normal" | "extreme")}
        className="select select-bordered select-primary w-full max-w-xs mb-4"
      >
        <option value="normal">Normal</option>
        <option value="extreme">Extrême</option>
      </select>
      <select
        value={gameLength}
        onChange={(e) => setGameLength(e.target.value as "normal" | "extended")}
        className="select select-bordered select-primary w-full max-w-xs mb-4"
      >
        <option value="normal">Normal</option>
        <option value="extended">Étendu</option>
      </select>
      <button onClick={handleCreateParty} className="btn btn-primary">
        Créer la Partie
      </button>
    </div>
  );
};

export default CreateParty;
