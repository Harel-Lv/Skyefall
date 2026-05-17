import type { Timestamp } from "firebase/firestore";

export type RoomStatus = "lobby" | "playing" | "voting" | "ended";

export interface Room {
  roomCode: string;
  hostId: string;
  status: RoomStatus;
  location: string | null;
  spyId: string | null;
  startedAt: Timestamp | null;
  durationSeconds: number;
  createdAt: Timestamp;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: Timestamp;
}

export interface Vote {
  voterId: string;
  votedPlayerId: string;
}
