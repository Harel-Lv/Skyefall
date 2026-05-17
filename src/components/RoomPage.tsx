import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Player, Room, Vote } from "../types";
import {
  ensureAnonymousUser,
  joinRoom,
  normalizeRoomCode,
  startGame,
  startNewRound,
  subscribePlayers,
  subscribeRoom,
  subscribeVotes,
  submitVote,
  transitionToVoting,
} from "../firebase/roomService";
import Lobby from "./Lobby";
import GameTimer from "./GameTimer";
import SecretCard from "./SecretCard";
import VotingPanel from "./VotingPanel";
import ResultScreen from "./ResultScreen";
import PlayerList from "./PlayerList";

const NAME_KEY = "skyfall.playerName";

function PhaseLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-slate-50">{title}</h2>
      {subtitle && <p className="mt-2 text-base text-slate-400">{subtitle}</p>}
    </div>
  );
}

export default function RoomPage() {
  const { roomCode: codeParam } = useParams();
  const navigate = useNavigate();
  const roomCode = useMemo(() => normalizeRoomCode(codeParam ?? ""), [codeParam]);

  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingName, setPendingName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const timerTriggered = useRef(false);

  useEffect(() => {
    let cancelled = false;
    ensureAnonymousUser()
      .then((u) => {
        if (!cancelled) setUid(u.uid);
      })
      .catch(() => {
        if (!cancelled) setError("Anonymous sign-in failed. Enable it in the Firebase console.");
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const unsubRoom = subscribeRoom(
      roomCode,
      setRoom,
      (e) => setError(`Room sync failed: ${e.message}`),
    );
    const unsubPlayers = subscribePlayers(roomCode, setPlayers, () => {});
    const unsubVotes = subscribeVotes(roomCode, setVotes, () => {});
    return () => {
      unsubRoom();
      unsubPlayers();
      unsubVotes();
    };
  }, [roomCode]);

  useEffect(() => {
    timerTriggered.current = false;
    if (room?.status !== "playing" || !room.startedAt) return;
    const rc = room.roomCode;
    const endMs = room.startedAt.toMillis() + room.durationSeconds * 1000;

    const tick = async () => {
      if (timerTriggered.current) return;
      if (Date.now() >= endMs) {
        timerTriggered.current = true;
        try {
          await transitionToVoting(rc);
        } catch {
          timerTriggered.current = false;
        }
      }
    };

    void tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [
    room?.status,
    room?.roomCode,
    room?.startedAt?.toMillis() ?? null,
    room?.durationSeconds,
  ]);

  useEffect(() => {
    if (!room?.startedAt || room.status !== "playing") return undefined;
    const rc = room.roomCode;
    const endMs = room.startedAt.toMillis() + room.durationSeconds * 1000;

    const handler = () => {
      if (document.visibilityState !== "visible" || timerTriggered.current) return;
      if (Date.now() >= endMs) {
        timerTriggered.current = true;
        void transitionToVoting(rc).catch(() => {
          timerTriggered.current = false;
        });
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [
    room?.status,
    room?.roomCode,
    room?.startedAt?.toMillis() ?? null,
    room?.durationSeconds,
  ]);

  const currentPlayer = uid ? players.find((p) => p.id === uid) : undefined;
  const isHost = currentPlayer?.isHost ?? false;
  const needsJoin = Boolean(uid && room && !currentPlayer);

  const storedName =
    typeof localStorage !== "undefined" ? (localStorage.getItem(NAME_KEY) ?? "") : "";

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const n = (pendingName || storedName).trim();
    if (!roomCode) return;
    if (!n) {
      setJoinError("Enter your name.");
      return;
    }
    setBusy(true);
    try {
      await joinRoom(roomCode, n);
      localStorage.setItem(NAME_KEY, n);
      setNotice("You joined this room!");
      window.setTimeout(() => setNotice(null), 3000);
    } catch (q) {
      setJoinError(q instanceof Error ? q.message : "Join failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = useCallback(async () => {
    if (!roomCode || !uid) return;
    setBusy(true);
    setError(null);
    try {
      await startGame(roomCode, uid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start game.");
    } finally {
      setBusy(false);
    }
  }, [roomCode, uid]);

  const handleVote = useCallback(
    async (votedPlayerId: string) => {
      if (!roomCode || !uid) return;
      setBusy(true);
      setError(null);
      try {
        await submitVote(roomCode, uid, votedPlayerId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Vote failed.");
      } finally {
        setBusy(false);
      }
    },
    [roomCode, uid],
  );

  const handleNewRound = useCallback(async () => {
    if (!roomCode || !uid) return;
    setBusy(true);
    setError(null);
    try {
      await startNewRound(roomCode, uid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start new round.");
    } finally {
      setBusy(false);
    }
  }, [roomCode, uid]);

  if (!roomCode || roomCode.length < 4) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-400">That link does not contain a valid room code.</p>
        <Link
          className="mt-8 inline-flex rounded-xl bg-sky-500 px-8 py-4 font-bold text-sky-950"
          to="/"
        >
          Go home
        </Link>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <p className="text-center text-lg text-slate-400">Signing you in…</p>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-400">We could not start an anonymous session.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-8 w-full rounded-xl border border-slate-700 bg-slate-900 py-4 text-lg font-semibold text-slate-50"
        >
          Back home
        </button>
      </div>
    );
  }

  if (room === undefined || room === null) {
    const body =
      room === null ? (
        <p className="text-slate-400">Room not found. Double-check your code.</p>
      ) : (
        <p className="text-slate-400">Loading…</p>
      );
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div>{body}</div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-8 w-full rounded-xl border border-slate-700 bg-slate-900 py-4 text-lg font-semibold text-slate-50"
        >
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Room</p>
          <p className="font-mono text-2xl font-bold tracking-[0.15em] text-sky-400">{roomCode}</p>
        </div>
        <button
          type="button"
          className="self-start rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
          onClick={() => navigate("/")}
        >
          Leave
        </button>
      </div>

      {notice && (
        <p className="mb-6 rounded-xl border border-emerald-600/60 bg-emerald-950/50 px-4 py-3 text-center text-emerald-200">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-6 rounded-xl border border-red-600/70 bg-red-950/60 px-4 py-3 text-red-100" role="alert">
          {error}
        </p>
      )}

      {needsJoin && (
        <section className="space-y-5">
          <PhaseLabel title="Join this room" subtitle="You are not in the player list yet." />
          <form onSubmit={handleJoinRoom} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your name</span>
              <input
                autoFocus
                value={pendingName || storedName}
                onChange={(e) => setPendingName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-lg text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="Display name"
                maxLength={32}
              />
            </label>
            {joinError && <p className="text-center text-sm text-red-400">{joinError}</p>}
            <button
              disabled={busy}
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-5 text-xl font-bold text-emerald-950 disabled:opacity-40"
            >
              Join players
            </button>
          </form>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full rounded-xl py-4 text-lg text-slate-500 underline-offset-4 hover:underline"
          >
            Wrong room code? Go home
          </button>
        </section>
      )}

      {!needsJoin && room.status === "lobby" && (
        <>
          <PhaseLabel title="Lobby" subtitle="Everyone here should have the same verbal rules before you begin." />
          <Lobby
            roomCode={roomCode}
            players={players}
            isHost={isHost}
            canStart={players.length >= 2}
            busy={busy}
            onStart={handleStart}
            onShare={() => setNotice("Invite link copied!")}
          />
        </>
      )}

      {!needsJoin && room.status === "playing" && uid && (
        <>
          <PhaseLabel title="Round in progress" subtitle="Discuss face to face — the app stays quiet." />
          <div className="space-y-5">
            <GameTimer startedAt={room.startedAt} durationSeconds={room.durationSeconds} />
            <SecretCard isSpy={room.spyId === uid} location={room.location} />
          </div>
          <div className="mt-10">
            <PlayerList players={players} />
          </div>
        </>
      )}

      {!needsJoin && room.status === "voting" && uid && (
        <>
          <PhaseLabel title="Cast your suspicion" subtitle="Once everyone submits, scores appear automatically." />
          <div className="space-y-6">
            <VotingPanel
              players={players}
              currentUserId={uid}
              votes={votes}
              submitting={busy}
              onVote={handleVote}
            />
          </div>
        </>
      )}

      {!needsJoin && room.status === "ended" && (
        <>
          <PhaseLabel title="Results are in" />
          <ResultScreen
            room={room}
            players={players}
            votes={votes}
            isHost={isHost}
            busy={busy}
            onNewRound={handleNewRound}
          />
        </>
      )}
    </div>
  );
}
