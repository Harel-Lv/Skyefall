import { useEffect, useMemo, useState } from "react";
import type { Timestamp } from "firebase/firestore";

interface GameTimerProps {
  startedAt: Timestamp | null;
  durationSeconds: number;
}

export default function GameTimer({ startedAt, durationSeconds }: GameTimerProps) {
  const endMs = useMemo(() => {
    if (!startedAt) return null;
    return startedAt.toMillis() + durationSeconds * 1000;
  }, [startedAt, durationSeconds]);

  const [remain, setRemain] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (!endMs) {
        setRemain(0);
        return;
      }
      const ms = Math.max(0, endMs - Date.now());
      const sec = Math.ceil(ms / 1000);
      setRemain(sec);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endMs]);

  const mins = Math.floor(remain / 60);
  const secs = remain % 60;

  return (
    <div className="rounded-2xl border border-sky-700/60 bg-sky-950/50 px-6 py-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/90">Discussion time</p>
      <p className="mt-4 font-mono text-5xl font-bold tabular-nums text-sky-100">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </p>
      <p className="mt-4 text-sm text-sky-200/75">Ask questions verbally. When time is up you will vote.</p>
    </div>
  );
}
