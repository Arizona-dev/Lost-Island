import axios from "axios";
import config from "../config";
import { Game, IUser } from "../types";

const API_URL = config.api.url + "/api/games";

/**
 * Get Authorization header with session token
 */
const getAuthHeader = () => {
  const sessionToken = localStorage.getItem("sessionToken");
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
};

// Créer une nouvelle partie
export const createGame = async (partyDetails: {
  partyName: string;
  maxPlayers: number;
  difficulty: "normal" | "extreme";
  gameLength: "normal" | "extended";
  voteDuration?: number;
  password?: string;
}) => {
  try {
    const partyOwner = localStorage.getItem("playerName");
    const playerId = localStorage.getItem("playerId");

    if (!partyOwner || !playerId) {
      throw new Error(
        "Le nom du joueur n'est pas défini, veuillez rafraîchir la page"
      );
    }

    const { data } = await axios.post(
      `${API_URL}/create`,
      {
        ...partyDetails,
        partyOwner: {
          id: playerId,
          name: partyOwner,
        },
      },
      {
        headers: getAuthHeader(),
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur lors de la création de la partie", error);
    throw error;
  }
};

// Rejoindre une partie existante
export const joinGame = async (player: IUser, partyId: string) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/${partyId}/join`,
      {
        player,
      },
      {
        headers: getAuthHeader(),
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur lors de la tentative de rejoindre la partie", error);
    throw error;
  }
};

// Récupérer la liste des parties en status created
export const getGames = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/`);
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des parties créées", error);
    throw error;
  }
};

export const getGame = async (
  gameCode: string,
  password?: string,
  playerId?: string
): Promise<Game> => {
  try {
    const params = playerId ? { playerId } : {};
    if (!password) {
      const { data } = await axios.get(`${API_URL}/${gameCode}`, { params });
      return data;
    }
    const { data } = await axios.get(`${API_URL}/${gameCode}/${password}`, { params });
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération de la partie", error);
    throw error;
  }
};

export const startGame = async (partyId: string) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/${partyId}/start`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur lors du démarrage de la partie", error);
    throw error;
  }
};

// Mettre à jour voteDuration d'une partie
export const updateVoteDuration = async (partyId: string, voteDuration: number) => {
  try {
    const { data } = await axios.patch(
      `${API_URL}/${partyId}/voteDuration`,
      {
        voteDuration,
      },
      {
        headers: getAuthHeader(),
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de voteDuration", error);
    throw error;
  }
};

// Réinitialiser une partie terminée
export const resetGame = async (partyId: string) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/${partyId}/reset`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de la partie", error);
    throw error;
  }
};

export default { createGame, joinGame, getGames, startGame, updateVoteDuration, resetGame };
