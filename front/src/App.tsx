import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Lobby from "./views/Lobby";
import Game from "./components/Game";
import GameOver from "./components/GameOver";
import JoinParty from "./components/JoinParty";
import CreateParty from "./components/CreateParty";
import Layout from "./components/Layout";
import "./App.css";
import GameLayout from "./components/GameLayout";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/join/:id" element={<JoinParty />} />
          <Route path="/create" element={<CreateParty />} />
          <Route path="/gameover" element={<GameOver />} />
        </Route>
        <Route path="/game" element={<GameLayout />}>
          <Route path="/game/:id" element={<Game />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
