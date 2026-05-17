import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRoom,
  ensureAnonymousUser,
  joinRoom,
  normalizeRoomCode,
} from "../firebase/roomService";

const NAME_KEY = "skyfall.playerName";

export default function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const persistName = (n: string) => localStorage.setItem(NAME_KEY, n.trim());

  const handleCreate = async () => {
    setError(null);
    setBusy(true);
    try {
      await ensureAnonymousUser();
      const n = name.trim();
      if (!n) {
        throw new Error("Enter your display name.");
      }
      const roomCode = await createRoom(n);
      persistName(n);
      navigate(`/r/${roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create room.");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    setError(null);
    setBusy(true);
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
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <header className="mb-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400/90">Skyfall</p>
        <h1 className="mt-3 text-balance text-4xl font-extrabold text-slate-50">Guess the hiding place</h1>
        <p className="mt-4 text-pretty text-base text-slate-400">
          One spy. Everyone else shares a secret location. Ask questions out loud, then vote.
        </p>
      </header>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Player name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            placeholder="How should we call you?"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-lg text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={handleCreate}
          className="w-full rounded-xl bg-sky-500 py-5 text-xl font-bold text-sky-950 shadow-lg shadow-sky-900/30 disabled:opacity-40"
        >
          Create room
        </button>

        <div className="border-t border-slate-800 pt-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABC12"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 font-mono text-lg uppercase tracking-widest text-slate-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={handleJoin}
            className="mt-4 w-full rounded-xl border border-slate-600 bg-slate-800 py-5 text-xl font-semibold text-slate-50 disabled:opacity-40"
          >
            Join room
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-950/70 px-3 py-3 text-center text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
