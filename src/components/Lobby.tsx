import type { MouseEventHandler } from "react";
import type { Player } from "../types";
import PlayerList from "./PlayerList";

interface LobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  canStart: boolean;
  spyCount: number;
  maxSpies: number;
  busy?: boolean;
  onStart?: () => void;
  onShare?: () => void;
  onSpyCountChange?: (next: number) => void;
}

export default function Lobby({
  roomCode,
  players,
  isHost,
  canStart,
  spyCount,
  maxSpies,
  busy,
  onStart,
  onShare,
  onSpyCountChange,
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

  const clampedDisplayed = Math.min(Math.max(1, spyCount), maxSpies);
  const options = Array.from({ length: maxSpies }, (_, i) => i + 1);

  const needsMorePlayers = !canStart && isHost;

  return (
    <div className="space-y-5">

      {/* Room code card */}
      <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-[#061018] p-5 shadow-xl shadow-black/35">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-[-40%] h-40 w-40 rounded-full bg-sky-500/15 blur-3xl"
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sky-200/75">
          Room code
        </p>
        <p className="mt-3 font-mono text-[2rem] font-bold leading-none tracking-[0.18em] text-sky-100">
          {roomCode}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Share this with friends — they tap the link and land here directly.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="touch-hit flex-1 min-h-[3rem] rounded-2xl border border-slate-600/70 bg-slate-800/80 py-2.5 text-sm font-semibold text-slate-100 shadow-inner shadow-black/20 transition-colors active:bg-slate-700"
          >
            📋 Copy link
          </button>
          {isHost && (
            <button
              type="button"
              disabled={!canStart || busy}
              onClick={() => { if (canStart && !busy) onStart?.(); }}
              className="touch-hit flex-1 min-h-[3rem] rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 py-2.5 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-950/30 transition-[filter] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-950/40 border-t-emerald-950" aria-hidden />
                  Starting…
                </span>
              ) : (
                "▶ Start game"
              )}
            </button>
          )}
        </div>

        {needsMorePlayers && (
          <p className="mt-3 text-center text-xs font-semibold text-amber-300/80">
            Need at least one more player to start
          </p>
        )}
        {!isHost && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Waiting for the host to start the round…
          </p>
        )}
      </div>

      {/* Spy count selector */}
      {(isHost || players.length >= 2) && (
        <div className="animate-fade-up rounded-3xl border border-violet-400/22 bg-gradient-to-br from-violet-950/40 to-slate-950/50 p-5 shadow-lg shadow-black/20"
          style={{ animationDelay: "60ms" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-violet-200/80">
            Mission setup
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Number of spies
          </p>

          {isHost ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {options.map((n) => {
                const active = n === clampedDisplayed;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={busy}
                    onClick={() => onSpyCountChange?.(n)}
                    className={`touch-hit min-h-[3rem] min-w-[3.5rem] flex-1 rounded-2xl text-lg font-bold transition-colors disabled:opacity-40 ${
                      active
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-900/35"
                        : "border border-slate-700/80 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-2xl font-extrabold text-violet-100">
              {clampedDisplayed}
              <span className="ml-2 text-base font-semibold text-slate-400">
                {clampedDisplayed === 1 ? "spy" : "spies"} — host chose
              </span>
            </p>
          )}

          <p className="mt-3 text-xs text-slate-600">
            At least one player must hold the location card
          </p>
        </div>
      )}

      {/* Dev warning */}
      {typeof window !== "undefined" &&
        window.location.hostname === "localhost" &&
        !import.meta.env.VITE_PUBLIC_APP_ORIGIN?.trim() && (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-950/35 px-4 py-3 text-sm leading-relaxed text-amber-50/90">
            Invite links point to{" "}
            <span className="font-mono font-semibold text-amber-200">localhost</span> — only works on
            this device. Set{" "}
            <span className="break-all font-mono text-[11px] text-amber-300">
              VITE_PUBLIC_APP_ORIGIN=https://skyefall.vercel.app
            </span>{" "}
            in <span className="font-mono text-xs">.env</span> and restart{" "}
            <span className="font-mono text-xs">npm run dev</span>.
          </p>
        )}

      {/* Link preview */}
      <details className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-2 text-sm">
        <summary className="touch-hit cursor-pointer py-3 font-medium text-slate-400 [&::-webkit-details-marker]:hidden">
          Invite link ↗
        </summary>
        <p className="pb-4 font-mono text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere]">
          {joinedUrl}
        </p>
      </details>

      <PlayerList players={players} />
    </div>
  );
}
