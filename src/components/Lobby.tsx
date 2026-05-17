import type { MouseEventHandler } from "react";
import type { Player } from "../types";
import PlayerList from "./PlayerList";

interface LobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  canStart: boolean;
  busy?: boolean;
  onStart?: () => void;
  onShare?: () => void;
}

export default function Lobby({
  roomCode,
  players,
  isHost,
  canStart,
  busy,
  onStart,
  onShare,
}: LobbyProps) {
  const inviteBaseUrl = (() => {
    const raw = import.meta.env.VITE_PUBLIC_APP_ORIGIN?.trim();
    if (raw) return raw.replace(/\/$/, "");
    return window.location.origin;
  })();
  const joinedUrl = `${inviteBaseUrl}/r/${roomCode}`;

  const handleShare: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    void navigator.clipboard?.writeText(joinedUrl).then(() => onShare?.()).catch(() => onShare?.());
    if (!navigator.clipboard) {
      prompt("Copy link:", joinedUrl);
      onShare?.();
    }
  };

  const handleStart = () => {
    if (!canStart || busy) return;
    onStart?.();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room code</p>
        <p className="mt-2 break-all font-mono text-3xl font-bold tracking-[0.2em] text-sky-400">{roomCode}</p>
        <p className="mt-2 text-sm text-slate-400">Share this code or link so others can join.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-4 text-lg font-semibold text-slate-100 active:bg-slate-700"
          >
            Copy invite link
          </button>
          {isHost && (
            <button
              type="button"
              disabled={!canStart || busy}
              onClick={handleStart}
              className="flex-1 rounded-xl bg-emerald-500 py-4 text-lg font-bold text-emerald-950 shadow-lg shadow-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start game
            </button>
          )}
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Link copied by the button above:{" "}
          <span className="font-mono text-slate-400 [word-break:break-all]">{joinedUrl}</span>
        </p>
      </div>

      {typeof window !== "undefined" &&
        window.location.hostname === "localhost" &&
        !import.meta.env.VITE_PUBLIC_APP_ORIGIN?.trim() && (
          <p className="rounded-lg border border-amber-600/50 bg-amber-950/35 px-4 py-3 text-sm text-amber-100/95">
            Invite links use <span className="font-mono text-amber-50">localhost</span> while you develop here — friends{" "}
            <span className="font-semibold">cannot</span> open that. Add{" "}
            <span className="font-mono text-xs text-amber-200">VITE_PUBLIC_APP_ORIGIN=https://your-site.vercel.app</span> to{" "}
            <span className="font-mono text-xs">.env</span> and restart{" "}
            <span className="font-mono text-xs">npm run dev</span>, or share from your live Vercel URL.
          </p>
        )}

      {!isHost && (
        <p className="text-center text-sm text-slate-500">Waiting for the host to start the round.</p>
      )}
      {!canStart && isHost && (
        <p className="text-center text-sm text-amber-400/90">Invite at least one other player to start.</p>
      )}

      <PlayerList players={players} />
    </div>
  );
}
