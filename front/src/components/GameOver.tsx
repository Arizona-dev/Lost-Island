import React from "react";
import { Link } from "react-router-dom";

const GameOver = () => {
  return (
    <div>
      <h2>Fin du Jeu</h2>
      <p>Félicitations, vous avez fini le jeu !</p>
      <Link to="/">Retour à l'accueil</Link>
    </div>
  );
};

export default GameOver;
