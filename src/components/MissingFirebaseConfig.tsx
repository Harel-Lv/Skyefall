export default function MissingFirebaseConfig() {
  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-amber-500/40 bg-slate-900/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">Setup</p>
        <h1 className="text-2xl font-bold text-slate-50">Firebase is not configured</h1>
        <p className="text-slate-300">
          The app needs a <span className="font-mono text-sky-300">.env</span> file in the project root with your
          Firebase web app keys (same names as in <span className="font-mono text-sky-300">.env.example</span>).
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-slate-400">
          <li>Copy <span className="font-mono text-slate-200">.env.example</span> to <span className="font-mono text-slate-200">.env</span></li>
          <li>Paste the six <span className="font-mono">VITE_FIREBASE_*</span> values from the Firebase console</li>
          <li>Restart <span className="font-mono">npm run dev</span></li>
        </ol>
        <p className="text-sm text-slate-500">
          Also open the browser devtools console (F12) — any red error there confirms a config or network issue.
        </p>
      </div>
    </div>
  );
}
