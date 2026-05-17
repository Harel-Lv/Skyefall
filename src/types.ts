import type { Timestamp } from "firebase/firestore";

export type RoomStatus = "lobby" | "playing" | "voting" | "ended";

export interface Room {
  roomCode: string;
  hostId: string;
  status: RoomStatus;
  location: string | null;
  /** Player ids designated as spies for the current round (empty in lobby). */
  spyIds: string[];
  /** Host-chosen number of spies before start / new round (stored; clamped at play time). */
  spyCount: number;
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
