import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  type QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { signInAnonymously, type User } from "firebase/auth";
import { LOCATIONS } from "../constants/locations";
import type { Player, Room, Vote } from "../types";
import { auth, db } from "./client";

export const GAME_DURATION_SECONDS = 7 * 60;

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function randomRoomCode(length = 5): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)]!;
  }
  return s;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export async function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

function roomDocRef(roomCode: string) {
  return doc(db, "rooms", normalizeRoomCode(roomCode));
}

function playersCol(roomCode: string) {
  return collection(db, "rooms", normalizeRoomCode(roomCode), "players");
}

function votesCol(roomCode: string) {
  return collection(db, "rooms", normalizeRoomCode(roomCode), "votes");
}

export async function createRoom(displayName: string): Promise<string> {
  const user = await ensureAnonymousUser();
  const name = displayName.trim();
  if (name.length < 1) throw new Error("Enter a name");

  for (let attempt = 0; attempt < 20; attempt++) {
    const roomCode = randomRoomCode();
    const ref = roomDocRef(roomCode);
    const snap = await getDoc(ref);
    if (snap.exists()) continue;

    const batch = writeBatch(db);
    batch.set(ref, {
      roomCode,
      hostId: user.uid,
      status: "lobby",
      location: null,
      spyId: null,
      startedAt: null,
      durationSeconds: GAME_DURATION_SECONDS,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(playersCol(roomCode), user.uid), {
      id: user.uid,
      name,
      isHost: true,
      joinedAt: serverTimestamp(),
    });
    await batch.commit();
    return roomCode;
  }
  throw new Error("Could not generate a room code. Try again.");
}

export async function joinRoom(roomCode: string, displayName: string): Promise<void> {
  const user = await ensureAnonymousUser();
  const code = normalizeRoomCode(roomCode);
  if (code.length < 4) throw new Error("Room code looks too short");
  const name = displayName.trim();
  if (name.length < 1) throw new Error("Enter a name");

  const ref = roomDocRef(code);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Room not found");

  const room = snap.data() as Room;
  const playerRef = doc(playersCol(code), user.uid);
  const existing = await getDoc(playerRef);
  if (existing.exists()) {
    await updateDoc(playerRef, { name });
    return;
  }

  if (room.status === "playing" || room.status === "voting") {
    throw new Error("That round already started — join before the host starts.");
  }

  await setDoc(playerRef, {
    id: user.uid,
    name,
    isHost: false,
    joinedAt: serverTimestamp(),
  });
}

export function subscribeRoom(
  roomCode: string,
  onData: (room: Room | null) => void,
  onError?: (e: Error) => void,
): () => void {
  const code = normalizeRoomCode(roomCode);
  return onSnapshot(
    roomDocRef(code),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as Room);
    },
    (err) => onError?.(err as Error),
  );
}

export function subscribePlayers(
  roomCode: string,
  onData: (players: Player[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const code = normalizeRoomCode(roomCode);
  const q = query(playersCol(code));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Player);
      list.sort((a, b) => a.joinedAt.toMillis() - b.joinedAt.toMillis());
      onData(list);
    },
    (err) => onError?.(err as Error),
  );
}

export function subscribeVotes(
  roomCode: string,
  onData: (votes: Vote[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const code = normalizeRoomCode(roomCode);
  return onSnapshot(
    votesCol(code),
    (snap) => {
      onData(snap.docs.map((d) => d.data() as Vote));
    },
    (err) => onError?.(err as Error),
  );
}

export async function startGame(roomCode: string, uid: string): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  const ref = roomDocRef(code);
  const roomSnap = await getDoc(ref);
  if (!roomSnap.exists()) throw new Error("Room not found");
  const room = roomSnap.data() as Room;
  if (room.hostId !== uid) throw new Error("Only the host can start");
  if (room.status !== "lobby") return;

  const playersSnap = await getDocs(playersCol(code));
  const ids = playersSnap.docs.map((d) => d.id);
  if (ids.length < 2) throw new Error("Need at least 2 players");

  const spyId = pickRandom(ids);
  const location = pickRandom(LOCATIONS);

  await updateDoc(ref, {
    status: "playing",
    spyId,
    location,
    startedAt: serverTimestamp(),
    durationSeconds: GAME_DURATION_SECONDS,
  });
}

export async function transitionToVoting(roomCode: string): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  const ref = roomDocRef(code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const room = snap.data() as Room;
  if (room.status !== "playing") return;
  await updateDoc(ref, {
    status: "voting",
  });
}

export async function submitVote(
  roomCode: string,
  voterId: string,
  votedPlayerId: string,
): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  const ref = roomDocRef(code);
  const roomSnap = await getDoc(ref);
  if (!roomSnap.exists()) throw new Error("Room not found");
  const room = roomSnap.data() as Room;
  if (room.status !== "voting") return;

  await setDoc(doc(votesCol(code), voterId), {
    voterId,
    votedPlayerId,
  });

  await tryFinalizeVotesIfComplete(code);
}

async function tryFinalizeVotesIfComplete(code: string): Promise<void> {
  const normalized = normalizeRoomCode(code);
  const ref = roomDocRef(normalized);
  const [roomSnap, playersSnap, votesSnap] = await Promise.all([
    getDoc(ref),
    getDocs(playersCol(normalized)),
    getDocs(votesCol(normalized)),
  ]);
  if (!roomSnap.exists()) return;
  const room = roomSnap.data() as Room;
  if (room.status !== "voting") return;
  const playerCount = playersSnap.size;
  if (playerCount < 1) return;
  if (votesSnap.size < playerCount) return;
  await updateDoc(ref, { status: "ended" });
}

async function batchDeleteVotes(docsToDelete: QueryDocumentSnapshot[]): Promise<void> {
  const chunk = 400;
  for (let i = 0; i < docsToDelete.length; i += chunk) {
    const batch = writeBatch(db);
    for (const d of docsToDelete.slice(i, i + chunk)) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
}

export async function deleteAllVotes(roomCode: string): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  const snap = await getDocs(votesCol(code));
  await batchDeleteVotes(snap.docs);
}

export async function startNewRound(roomCode: string, hostId: string): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  const ref = roomDocRef(code);
  const roomSnap = await getDoc(ref);
  if (!roomSnap.exists()) throw new Error("Room not found");
  const room = roomSnap.data() as Room;
  if (room.hostId !== hostId) throw new Error("Only the host can start a new round");
  if (room.status !== "ended") throw new Error("Round cannot start now");

  const playersSnap = await getDocs(playersCol(code));
  const ids = playersSnap.docs.map((d) => d.id);
  if (ids.length < 2) throw new Error("Need at least 2 players");

  const spyId = pickRandom(ids);
  const location = pickRandom(LOCATIONS);

  await deleteAllVotes(code);
  await updateDoc(ref, {
    status: "playing",
    spyId,
    location,
    startedAt: serverTimestamp(),
    durationSeconds: GAME_DURATION_SECONDS,
  });
}
