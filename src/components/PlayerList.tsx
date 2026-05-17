import type { Player } from "../types";

interface PlayerListProps {
  players: Player[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function hueFromPlayerId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/55 p-4 shadow-inner shadow-black/20">
      <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Players</h2>
      <p className="mb-4 text-xs text-slate-600">{players.length} in this room</p>
      <ul className="space-y-2">
        {players.map((p) => {
          const h = hueFromPlayerId(p.id);
          const grad = `linear-gradient(148deg, hsl(${h} 78% 48%), hsl(${h} 70% 32%))`;
          return (
            <li key={p.id}>
              <div className="flex min-h-[3.35rem] items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-950/50 px-3 py-2.5 shadow-sm shadow-black/20">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold uppercase tracking-wide text-white ring-2 ring-black/25"
                  style={{ backgroundImage: grad }}
                  aria-hidden
                >
                  {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-100">{p.name}</span>
                  {p.isHost && (
                    <span className="mt-0.5 inline-block rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                      Host
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
