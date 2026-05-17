import { useState } from "react";

interface SecretCardProps {
  isSpy: boolean;
  location: string | null;
  multipleSpies?: boolean;
}

export default function SecretCard({ isSpy, location, multipleSpies }: SecretCardProps) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="touch-hit group relative w-full overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/90 px-6 py-14 text-center shadow-xl shadow-black/40 transition-[transform,filter] active:scale-[0.98] active:brightness-110"
        aria-label="Tap to reveal your secret role"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(148,163,184,0.07),_transparent_65%)]"
        />
        <div className="relative space-y-4">
          <p className="text-6xl leading-none" aria-hidden>🔒</p>
          <p className="text-xl font-bold text-slate-100">Tap to reveal your role</p>
          <p className="text-sm leading-relaxed text-slate-500">
            Make sure nobody else can see your screen
          </p>
        </div>
      </button>
    );
  }

  if (isSpy) {
    return (
      <div
        role="region"
        aria-label="Your secret role"
        className="animate-fade-up relative overflow-hidden rounded-3xl border border-red-400/30 bg-slate-900/90 p-6 shadow-xl shadow-red-950/30"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-red-600/10 blur-2xl"
        />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-300/80">
            Spy brief
          </p>
          <p className="mt-4 text-6xl leading-none" aria-hidden>👁️</p>
          <p className="mt-4 text-[1.75rem] font-extrabold leading-tight tracking-tight text-red-200">
            {multipleSpies ? "You are a spy" : "You are the spy"}
          </p>
          <div className="mt-5 space-y-2 rounded-2xl border border-red-500/15 bg-red-950/25 px-4 py-4">
            <p className="text-sm font-medium leading-relaxed text-slate-300">
              Guess the secret location without getting caught.
            </p>
            <p className="text-sm leading-relaxed text-slate-400">
              Ask vague questions · blend in · never reveal you don&apos;t know where you are.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Your secret role"
      className="animate-fade-up relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-slate-900/90 p-6 shadow-xl shadow-emerald-950/25"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/12 blur-3xl"
      />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-300/80">
          Location card
        </p>
        <p className="mt-4 text-5xl leading-none" aria-hidden>📍</p>
        <p className="mt-3 text-sm font-medium text-slate-500">Secret meeting point</p>
        <p className="mt-1 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-100 bg-clip-text text-[2rem] font-extrabold leading-tight tracking-tight text-transparent sm:text-[2.25rem]">
          {location ?? "—"}
        </p>
        <div className="mt-5 space-y-2 rounded-2xl border border-emerald-500/15 bg-emerald-950/25 px-4 py-4">
          <p className="text-sm font-medium leading-relaxed text-slate-300">
            Everyone except the {multipleSpies ? "spies" : "spy"} shares this location.
          </p>
          <p className="text-sm leading-relaxed text-slate-400">
            Keep your screen face-down · talk naturally · help expose the infiltrators.
          </p>
        </div>
      </div>
    </div>
  );
}
