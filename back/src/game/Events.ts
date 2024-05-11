import { PlayerAction } from "./Player";

export type EventLogEntry = {
  type: string;
  data: any;
};

export type GameEvent =
  | ["JOIN_GAME", { gameId: string; playerId: string; playerName: string }]
  | ["PLAYER_JOINED", { playerId: string; playerName: string }]
  | ["PLAYER_LEFT", { playerId: string }]
  | ["GAME_STARTED", {}]
  | ["GAME_ENDED", {}]
  | ["YOUR_TURN", {}]
  | ["TURN_STARTED", { playerId: string }]
  | ["TURN_ENDED", { playerId: string }]
  | ["PLAYER_ACTION", { playerId: string; action: PlayerAction }]
  | ["ACTION_PROCESSED", { playerId: string }]
  | ["VOTE", { playerId: string; targetPlayerId: string }];

export enum GameEvents {
  JOIN_GAME = "JOIN_GAME",
  LEAVE_GAME = "LEAVE_GAME",
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  GAME_STARTED = "GAME_STARTED",
  GAME_ENDED = "GAME_ENDED",
  UPDATE_GAME_STATE = "UPDATE_GAME_STATE",
  YOUR_TURN = "YOUR_TURN",
  TURN_STARTED = "TURN_STARTED",
  TURN_ENDED = "TURN_ENDED",
  PLAYER_ACTION = "PLAYER_ACTION",
  ACTION_PROCESSED = "ACTION_PROCESSED",
  VOTE = "VOTE",
}

// TODO: Implement this function
export const handleGameEvent = (event: GameEvent) => {
  switch (event[0]) {
    case GameEvents.PLAYER_JOINED:
      return `Player ${event[1].playerId} joined the game`;
    case GameEvents.PLAYER_LEFT:
      return `Player ${event[1].playerId} left the game`;
    case GameEvents.GAME_STARTED:
      return "Game started";
    case GameEvents.GAME_ENDED:
      return "Game ended";
    case GameEvents.TURN_STARTED:
      return `Player ${event[1].playerId}'s turn`;
    case GameEvents.TURN_ENDED:
      return `Player ${event[1].playerId}'s turn ended`;
    case GameEvents.PLAYER_ACTION:
      return `Player ${event[1].playerId} performed an action`;
    case GameEvents.ACTION_PROCESSED:
      return `Player ${event[1].playerId}'s action processed`;
    case GameEvents.VOTE:
      return `Player ${event[1].playerId} voted for player ${event[1].targetPlayerId}`;
  }
};
