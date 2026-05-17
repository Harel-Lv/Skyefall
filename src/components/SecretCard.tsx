interface SecretCardProps {
  isSpy: boolean;
  location: string | null;
}

export default function SecretCard({ isSpy, location }: SecretCardProps) {
  return (
    <div className="rounded-2xl border border-violet-500/40 bg-slate-900/80 p-6 shadow-inner shadow-black/40">
      <p className="text-xs font-semibold uppercase tracking-widest text-violet-300/90">Private</p>
      <p className="mt-6 text-xl font-semibold leading-relaxed text-slate-50">
        {isSpy ? (
          <>
            You are <span className="text-red-400">the spy</span>.
            <span className="mt-4 block text-base font-normal text-slate-400">
              Guess the secret location without being caught — ask clever questions aloud.
            </span>
          </>
        ) : (
          <>
            Location:{" "}
            <span className="block mt-3 text-2xl font-bold text-emerald-300">{location ?? "—"}</span>
            <span className="mt-4 block text-base font-normal text-slate-400">
              Discuss by voice with the group — do not show this screen to anyone.
            </span>
          </>
        )}
      </p>
    </div>
  );
}
