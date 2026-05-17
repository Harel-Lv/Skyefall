import type { Player } from "../types";

interface PlayerListProps {
  players: Player[];
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Players ({players.length})
      </h2>
      <ul className="space-y-2">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg bg-slate-800/70 px-3 py-3 text-base"
          >
            <span className="font-medium text-slate-100">{p.name}</span>
            {p.isHost && (
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-300">
                Host
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
