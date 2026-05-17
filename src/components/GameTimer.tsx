import { useEffect, useMemo, useState } from "react";
import type { Timestamp } from "firebase/firestore";

interface GameTimerProps {
  startedAt: Timestamp | null;
  durationSeconds: number;
}

const R = 44;
const C = 2 * Math.PI * R;

export default function GameTimer({ startedAt, durationSeconds }: GameTimerProps) {
  const endMs = useMemo(() => {
    if (!startedAt) return null;
    return startedAt.toMillis() + durationSeconds * 1000;
  }, [startedAt, durationSeconds]);

  const [remain, setRemain] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (!endMs) { setRemain(0); return; }
      setRemain(Math.ceil(Math.max(0, endMs - Date.now()) / 1000));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [endMs]);

  const mins = Math.floor(remain / 60);
  const secs = remain % 60;
  const total = Math.max(1, durationSeconds);
  const frac = startedAt ? Math.min(1, Math.max(0, remain / total)) : 0;
  const dashOffset = C * (1 - frac);

  const urgent = remain <= 30 && remain > 0;
  const done = startedAt !== null && remain === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-7 shadow-xl shadow-black/35 transition-colors duration-1000 ${
        done
          ? "border-emerald-500/40"
          : urgent
          ? "border-amber-400/50"
          : "border-sky-500/20"
      }`}
    >
      {/* ambient glow blob */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full blur-3xl transition-colors duration-1000 ${
          urgent ? "bg-amber-500/15" : "bg-sky-500/10"
        }`}
      />

      {/* pulsing urgent ring */}
      {urgent && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-amber-400/45 animate-pulse"
        />
      )}

      <p
        className={`relative text-center text-[11px] font-bold uppercase tracking-[0.28em] transition-colors duration-700 ${
          done ? "text-emerald-300/80" : urgent ? "text-amber-200/85" : "text-sky-300/80"
        }`}
      >
        {done ? "Time is up" : urgent ? "Wrapping up…" : "Discussion time"}
      </p>

      {/* Ring + countdown */}
      <div className="relative mx-auto mt-5 grid max-w-[200px] place-items-center">
        <svg viewBox="0 0 100 100" className="aspect-square w-full" aria-hidden>
          <circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-slate-800"
          />
          <circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
            className={`transition-colors duration-700 ${
              done ? "text-emerald-400" : urgent ? "text-amber-400" : "text-sky-400"
            }`}
            style={{ transition: "stroke-dashoffset 0.85s cubic-bezier(.4,.14,.4,1), color 0.7s" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {startedAt ? (
            <p
              className={`font-mono text-5xl font-bold tabular-nums tracking-tight transition-colors duration-700 ${
                done ? "text-emerald-100" : urgent ? "text-amber-50" : "text-sky-50"
              }`}
            >
              {String(mins).padStart(2, "0")}
              <span className="opacity-50">:</span>
              {String(secs).padStart(2, "0")}
            </p>
          ) : (
            <p className="font-mono text-4xl font-bold text-slate-600">—:—</p>
          )}
        </div>
      </div>

      <p className="relative mx-auto mt-6 max-w-xs text-center text-sm leading-relaxed text-slate-400/80">
        {done
          ? "Voting is opening now…"
          : "Ask questions out loud — the ring empties as time runs out."}
      </p>
    </div>
  );
}
