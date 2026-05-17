import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRoom,
  ensureAnonymousUser,
  joinRoom,
  normalizeRoomCode,
} from "../firebase/roomService";

const NAME_KEY = "skyfall.playerName";

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
      aria-hidden
    />
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const busy = creating || joining;

  const persistName = (n: string) => localStorage.setItem(NAME_KEY, n.trim());

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      await ensureAnonymousUser();
      const n = name.trim();
      if (!n) throw new Error("Enter your display name.");
      const roomCode = await createRoom(n);
      persistName(n);
      navigate(`/r/${roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create room.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    setError(null);
    setJoining(true);
    try {
      await ensureAnonymousUser();
      const n = name.trim();
      if (!n) throw new Error("Enter your display name.");
      const c = normalizeRoomCode(code);
      if (c.length < 4) throw new Error("Enter a valid room code.");
      await joinRoom(c, n);
      persistName(n);
      navigate(`/r/${c}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join room.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden pt-safe pb-safe">

      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-18%] h-[min(100vw,460px)] w-[min(100vw,460px)] -translate-x-1/2 rounded-full bg-sky-500/[0.12] blur-[110px]" />
        <div className="absolute bottom-[-20%] left-[-30%] h-[360px] w-[360px] rounded-full bg-violet-600/[0.10] blur-[90px]" />
        <div className="absolute right-[-35%] top-[40%] h-[260px] w-[260px] rounded-full bg-emerald-500/[0.06] blur-[80px]" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">

        {/* Hero */}
        <header className="mb-10 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/22 bg-sky-950/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.35em] text-sky-200/90 shadow-lg shadow-black/20 backdrop-blur-sm">
            Skyfall
          </div>
          <h1 className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-[2rem] font-extrabold leading-[1.1] tracking-tight text-transparent sm:text-5xl">
            Guess where<br />they&apos;re hiding
          </h1>
          <p className="mx-auto mt-4 max-w-[20rem] text-pretty text-base leading-relaxed text-slate-400">
            Everyone holds a phone. One spy. One secret place. Ask questions — then vote.
          </p>
        </header>

        {/* Card */}
        <div className="animate-fade-up space-y-4 rounded-[1.35rem] border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl">

          {/* Name input */}
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Display name
            </span>
            <input
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              placeholder="Friends will see this"
              enterKeyHint="done"
              className="touch-hit mt-2 min-h-[54px] w-full rounded-2xl border border-slate-700/90 bg-slate-950 px-4 py-3 text-lg font-medium text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </label>

          {/* Create */}
          <button
            type="button"
            disabled={busy}
            onClick={handleCreate}
            className="touch-hit flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-sky-400 to-sky-600 py-3.5 text-lg font-bold text-slate-950 shadow-lg shadow-sky-950/30 transition-[filter] active:brightness-95 disabled:opacity-50"
          >
            {creating ? <><Spinner /> Creating…</> : "Create room"}
          </button>

          {/* Divider */}
          <div className="relative py-5">
            <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
            <p className="relative mx-auto w-fit bg-slate-900/90 px-3 text-center text-[11px] font-bold uppercase tracking-[0.4em] text-slate-500">
              or join
            </p>
          </div>

          {/* Code input */}
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Room code
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABC12"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="touch-hit mt-2 min-h-[54px] w-full rounded-2xl border border-slate-700/90 bg-slate-950 px-4 py-3 font-mono text-lg font-semibold uppercase tracking-[0.22em] text-slate-100 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>

          <button
            type="button"
            disabled={busy}
            onClick={handleJoin}
            className="touch-hit flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-600/70 bg-slate-800 py-3.5 text-lg font-semibold text-slate-50 shadow-inner shadow-black/20 transition-colors active:bg-slate-700 disabled:opacity-50"
          >
            {joining ? <><Spinner /> Joining…</> : "Join room"}
          </button>

          {error && (
            <p
              className="rounded-2xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-center text-sm font-medium leading-relaxed text-red-100"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-[12px] leading-relaxed text-slate-600">
          Best with everyone in the same room · keep your card private · host picks spy count
        </p>
      </div>
    </div>
  );
}
