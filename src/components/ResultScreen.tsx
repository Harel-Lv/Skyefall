import type { Player, Room, Vote } from "../types";
import { tallyVotes } from "../logic/votes";

interface ResultScreenProps {
  room: Room;
  players: Player[];
  votes: Vote[];
  isHost: boolean;
  busy?: boolean;
  onNewRound?: () => void;
}

export default function ResultScreen({
  room,
  players,
  votes,
  isHost,
  busy,
  onNewRound,
}: ResultScreenProps) {
  const spyIds = Array.isArray(room.spyIds) && room.spyIds.length > 0 ? room.spyIds : [];
  const spyNames =
    spyIds
      .map((id) => players.find((p) => p.id === id)?.name ?? id.slice(0, 6))
      .filter(Boolean)
      .join(", ") || "Nobody";

  const plural = spyIds.length > 1;
  const { topVotedIds, groupWins, tally } = tallyVotes(spyIds, votes);

  const topNames =
    topVotedIds.map((id) => players.find((p) => p.id === id)?.name ?? id.slice(0, 6)).join(", ") ||
    "Nobody";

  const tallyRows = [...tally.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">

      {/* Winner banner */}
      <div
        className={`animate-fade-up relative overflow-hidden rounded-3xl border p-7 text-center shadow-2xl ${
          groupWins
            ? "border-emerald-400/35 bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-950 shadow-emerald-950/40"
            : "border-amber-400/30 bg-gradient-to-br from-amber-950/55 via-slate-950 to-slate-950 shadow-amber-950/30"
        }`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${
            groupWins ? "bg-emerald-400/25" : "bg-amber-400/20"
          }`}
        />
        <p className="relative text-6xl leading-none" aria-hidden>
          {groupWins ? "🎉" : "🕵️"}
        </p>
        <p
          className={`relative mt-4 text-[2rem] font-extrabold leading-tight tracking-tight ${
            groupWins ? "text-emerald-200" : "text-amber-200"
          }`}
        >
          {groupWins ? "Players win!" : plural ? "Spies win!" : "Spy wins!"}
        </p>
        <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
          {groupWins
            ? `The group correctly identified the ${plural ? "infiltrators" : "infiltrator"}`
            : `The ${plural ? "spies slipped" : "spy slipped"} through undetected`}
        </p>
      </div>

      {/* Reveal details */}
      <div
        className="animate-fade-up rounded-3xl border border-slate-800/70 bg-slate-900/60 p-5 shadow-lg shadow-black/25"
        style={{ animationDelay: "80ms" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Reveal</p>
        <dl className="mt-5 space-y-5">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {plural ? "Spies" : "Spy"}
            </dt>
            <dd className="mt-1.5 text-2xl font-extrabold tracking-tight text-red-300">
              {spyNames}
            </dd>
          </div>
          <div className="border-t border-slate-800/70 pt-5">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Secret location
            </dt>
            <dd className="mt-1.5 text-2xl font-extrabold tracking-tight text-teal-200">
              {room.location ?? "Unknown"}
            </dd>
          </div>
          <div className="border-t border-slate-800/70 pt-5">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Most votes went to
            </dt>
            <dd className="mt-1.5 text-xl font-bold text-sky-300">{topNames}</dd>
          </div>
        </dl>
      </div>

      {/* Vote tally */}
      <div
        className="animate-fade-up rounded-3xl border border-slate-800/60 bg-slate-950/60 p-4 shadow-inner shadow-black/20"
        style={{ animationDelay: "140ms" }}
      >
        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
          Vote breakdown
        </h3>
        <ul className="mt-4 divide-y divide-slate-800/70">
          {tallyRows.length === 0 ? (
            <li className="py-4 text-center text-sm text-slate-500">No votes recorded.</li>
          ) : (
            tallyRows.map(([id, n]) => {
              const nm = players.find((p) => p.id === id)?.name ?? id.slice(0, 8);
              const isSpy = spyIds.includes(id);
              const maxVotes = tallyRows[0][1];
              const barWidth = maxVotes > 0 ? Math.round((n / maxVotes) * 100) : 0;
              return (
                <li key={id} className="py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-semibold text-slate-100">{nm}</span>
                      {isSpy && (
                        <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                          spy
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-sm font-bold text-sky-400/90">
                      {n}
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-500/60 transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {isHost ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onNewRound?.()}
          className="touch-hit flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-violet-400 to-violet-700 py-3.5 text-lg font-bold text-violet-50 shadow-xl shadow-violet-950/40 transition-[filter] active:brightness-95 disabled:opacity-40"
        >
          {busy && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200/40 border-t-violet-100" aria-hidden />
          )}
          New round
        </button>
      ) : (
        <p className="text-center text-sm font-medium text-slate-500">
          Waiting for the host to start a new round.
        </p>
      )}
    </div>
  );
}
