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
  updateLobbySpyCount,
} from "../firebase/roomService";
import Lobby from "./Lobby";
import GameTimer from "./GameTimer";
import SecretCard from "./SecretCard";
import VotingPanel from "./VotingPanel";
import ResultScreen from "./ResultScreen";
import PlayerList from "./PlayerList";

const NAME_KEY = "skyfall.playerName";

function PhaseLabel({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        {badge && (
          <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {badge}
          </span>
        )}
      </div>
      <h2 className={`text-balance text-2xl font-extrabold tracking-tight text-slate-50 ${badge ? "mt-3" : ""}`}>
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-pretty text-base leading-relaxed text-slate-400">{subtitle}</p>}
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

  useEffect(() => {
    if (!roomCode || !uid || !room || room.status !== "lobby") return;
    if (room.hostId !== uid) return;
    const maxSpies = Math.max(1, players.length - 1);
    const current = typeof room.spyCount === "number" ? room.spyCount : 1;
    const clamped = Math.min(Math.max(1, current), maxSpies);
    if (current !== clamped) {
      void updateLobbySpyCount(roomCode, uid, clamped);
    }
  }, [players.length, room, room?.hostId, room?.spyCount, room?.status, roomCode, uid]);

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

  const handleSpyCountChange = useCallback(
    async (next: number) => {
      if (!roomCode || !uid) return;
      setBusy(true);
      setError(null);
      try {
        await updateLobbySpyCount(roomCode, uid, next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update spy count.");
      } finally {
        setBusy(false);
      }
    },
    [roomCode, uid],
  );

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
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 pb-safe pt-safe text-center">
        <p className="text-slate-400">That link does not contain a valid room code.</p>
        <Link
            className="touch-hit mt-8 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-b from-sky-400 to-sky-600 px-8 py-3 text-[1.05rem] font-bold text-slate-950 shadow-lg shadow-sky-950/30"
          to="/"
        >
          Go home
        </Link>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 pt-safe pb-safe">
        <p className="text-center text-[1.05rem] font-medium text-slate-400">Connecting your session…</p>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="mx-auto max-w-md px-4 pb-safe pt-16 text-center">
        <p className="text-slate-400">We could not start an anonymous session.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="touch-hit mt-8 w-full rounded-2xl border border-slate-700 bg-slate-900 py-4 text-[1.05rem] font-semibold text-slate-50 shadow-lg shadow-black/25"
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
      <div className="mx-auto max-w-md px-4 pb-safe pt-16 text-center">
        <div>{body}</div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="touch-hit mt-8 w-full rounded-2xl border border-slate-700 bg-slate-900 py-4 text-[1.05rem] font-semibold text-slate-50 shadow-lg shadow-black/25"
        >
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden pb-safe pt-safe">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[min(52vh,360px)] bg-gradient-to-b from-sky-950/55 via-transparent to-transparent"
      />

      <div className="relative mx-auto min-h-dvh max-w-md px-4 pb-safe pt-6 sm:pt-10">
        <header className="sticky top-0 z-40 -mx-4 mb-6 border-b border-slate-800/60 bg-slate-950/90 px-4 pb-4 pt-4 backdrop-blur-xl backdrop-saturate-150">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">Room code</p>
              <p className="mt-1.5 truncate font-mono text-2xl font-bold tracking-[0.12em] text-sky-300">
                {roomCode}
              </p>
            </div>
            <button
              type="button"
              className="touch-hit shrink-0 rounded-2xl border border-slate-600/70 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm shadow-black/20 transition-colors active:bg-slate-800"
              onClick={() => navigate("/")}
            >
              Leave
            </button>
          </div>
        </header>

      {notice && (
        <p className="mb-6 rounded-2xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-3 text-center text-sm font-medium leading-relaxed text-emerald-100 shadow-lg shadow-black/15">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-6 rounded-2xl border border-red-500/35 bg-red-950/55 px-4 py-3.5 text-sm font-medium leading-relaxed text-red-50 shadow-lg shadow-black/20" role="alert">
          {error}
        </p>
      )}

      {needsJoin && (
        <section className="space-y-5">
          <PhaseLabel badge="Join" title="Add yourself" subtitle="You are linked to this room but not in the roster yet." />
          <form
            onSubmit={handleJoinRoom}
            className="space-y-4 rounded-3xl border border-slate-800/90 bg-slate-900/70 p-5 shadow-xl shadow-black/25"
          >
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your name</span>
              <input
                autoFocus
                value={pendingName || storedName}
                onChange={(e) => setPendingName(e.target.value)}
                className="touch-hit mt-2 w-full min-h-[52px] rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-lg text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/35"
                placeholder="Display name"
                maxLength={32}
              />
            </label>
            {joinError && <p className="text-center text-sm text-red-400">{joinError}</p>}
            <button
              disabled={busy}
              type="submit"
              className="touch-hit w-full min-h-[54px] rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-emerald-950 shadow-lg shadow-emerald-950/35 transition-[transform,filter] active:brightness-95 disabled:opacity-40"
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
          <PhaseLabel badge="Lobby" title="Hang tight — almost there" subtitle="Align on rules out loud before the host kicks off." />
          <Lobby
            roomCode={roomCode}
            players={players}
            isHost={isHost}
            canStart={players.length >= 2}
            spyCount={room.spyCount}
            maxSpies={Math.max(1, players.length - 1)}
            busy={busy}
            onStart={handleStart}
            onShare={() => setNotice("Invite link copied!")}
            onSpyCountChange={handleSpyCountChange}
          />
        </>
      )}

      {!needsJoin && room.status === "playing" && uid && (
        <>
          <PhaseLabel badge="Discuss" title={'Questions & bluffing'} subtitle="Talk in person — this screen stays private." />
          <div className="space-y-5">
            <GameTimer startedAt={room.startedAt} durationSeconds={room.durationSeconds} />
            <SecretCard
              isSpy={room.spyIds.includes(uid)}
              location={room.location}
              multipleSpies={(room.spyIds?.length ?? 0) > 1}
            />
          </div>
          <div className="mt-10">
            <PlayerList players={players} />
          </div>
        </>
      )}

      {!needsJoin && room.status === "voting" && uid && (
        <>
          <PhaseLabel badge="Vote" title="Point the finger" subtitle="Submit once everyone is ready — results unlock automatically." />
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
          <PhaseLabel badge="Reveal" title="How did it go?" />
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
    </div>
  );
}
