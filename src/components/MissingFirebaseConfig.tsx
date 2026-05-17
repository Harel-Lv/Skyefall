export default function MissingFirebaseConfig() {
  const isHosted =
    typeof window !== "undefined" &&
    /vercel\.app$|\.netlify\.app$|firebaseapp\.com$/i.test(window.location.hostname);

  return (
    <div className="min-h-dvh bg-slate-950 px-4 pb-safe pt-safe text-slate-100">
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-amber-500/40 bg-slate-900/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">Setup</p>
        <h1 className="text-2xl font-bold text-slate-50">Firebase is not configured</h1>

        {isHosted ? (
          <>
            <p className="text-slate-300">
              On hosting (Vercel, etc.) there is no <span className="font-mono text-sky-300">.env</span> file — you
              must add the same six{" "}
              <span className="font-mono text-sky-200">VITE_FIREBASE_*</span> keys in the host&apos;s environment
              variables, then <span className="font-semibold text-slate-100">redeploy</span> so the build can bake
              them in.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-slate-400">
              <li>Vercel → your project → Settings → Environment Variables</li>
              <li>
                Add each: <span className="font-mono text-sm">VITE_FIREBASE_API_KEY</span>,{" "}
                <span className="font-mono text-sm">VITE_FIREBASE_AUTH_DOMAIN</span>,{" "}
                <span className="font-mono text-sm">VITE_FIREBASE_PROJECT_ID</span>,{" "}
                <span className="font-mono text-sm">VITE_FIREBASE_STORAGE_BUCKET</span>,{" "}
                <span className="font-mono text-sm">VITE_FIREBASE_MESSAGING_SENDER_ID</span>,{" "}
                <span className="font-mono text-sm">VITE_FIREBASE_APP_ID</span> (copy from Firebase console /
                your local .env).
              </li>
              <li>Enable them for Production, save, then Deployments → … → Redeploy.</li>
            </ol>
          </>
        ) : (
          <>
            <p className="text-slate-300">
              The app needs a <span className="font-mono text-sky-300">.env</span> file in the project root with your
              Firebase web app keys (same names as in <span className="font-mono text-sky-300">.env.example</span>).
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-slate-400">
              <li>Copy <span className="font-mono text-slate-200">.env.example</span> to <span className="font-mono text-slate-200">.env</span></li>
              <li>Paste the six <span className="font-mono">VITE_FIREBASE_*</span> values from the Firebase console</li>
              <li>Restart <span className="font-mono">npm run dev</span></li>
            </ol>
          </>
        )}
        <p className="text-sm text-slate-500">
          Open browser devtools (F12 → Console) for any red errors about config or network.
        </p>
      </div>
    </div>
  );
}
