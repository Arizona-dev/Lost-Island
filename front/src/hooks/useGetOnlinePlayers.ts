import { useEffect, useState } from "react";
import socket from "../socket";

const useGetOnlinePlayers = () => {
  const [onlinePlayers, setOnlinePlayers] = useState<number>(0);

  useEffect(() => {
    // Écouter l'événement 'onlinePlayers' pour mettre à jour le nombre de joueurs en ligne
    socket.on("onlinePlayers", (players: number) => {
      setOnlinePlayers(players);
    });

    // Nettoyage en se désabonnant des événements à la destruction du composant
    return () => {
      socket.off("onlinePlayers");
    };
  }, []);

  // Fonction pour récupérer le nombre de joueurs en ligne
  const getOnlinePlayers = () => {
    socket.emit("getOnlinePlayers");
  };

  return { onlinePlayers, getOnlinePlayers };
};

export default useGetOnlinePlayers;
