import axios from "axios";
import config from "../config";
import { GameSettings, IUser } from "../types";

const API_URL = config.api.url + "/api/games";

// Créer une nouvelle partie
export const createGame = async (partyDetails: {
  partyName: string;
  maxPlayers: number;
  difficulty: "normal" | "extreme";
  gameLength: "normal" | "extended";
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

    const { data } = await axios.post(`${API_URL}/create`, {
      ...partyDetails,
      partyOwner: {
        id: playerId,
        name: partyOwner,
      },
    });
    // await joinGame({ id: playerId, name: partyOwner }, data._id);
    return data;
  } catch (error) {
    console.error("Erreur lors de la création de la partie", error);
    throw error;
  }
};

// Rejoindre une partie existante
export const joinGame = async (player: IUser, partyId: string) => {
  try {
    const { data } = await axios.post(`${API_URL}/${partyId}/join`, {
      player,
    });
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
  password?: string
): Promise<GameSettings> => {
  try {
    if (!password) {
      const { data } = await axios.get(`${API_URL}/${gameCode}`);
      return data;
    }
    const { data } = await axios.get(`${API_URL}/${gameCode}/${password}`);
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération de la partie", error);
    throw error;
  }
};

export const startGame = async (partyId: string) => {
  try {
    const { data } = await axios.post(`${API_URL}/${partyId}/start`);
    return data;
  } catch (error) {
    console.error("Erreur lors du démarrage de la partie", error);
    throw error;
  }
};

export default { createGame, joinGame, getGames, startGame };
