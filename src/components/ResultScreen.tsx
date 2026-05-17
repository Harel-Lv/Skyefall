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
  const spyId = room.spyId ?? "";
  const spyName = players.find((p) => p.id === spyId)?.name ?? spyId.slice(0, 6);

  const { topVotedIds, groupWins, tally } = tallyVotes(spyId, votes);

  const topNames =
    topVotedIds.map((id) => players.find((p) => p.id === id)?.name ?? id.slice(0, 6)).join(", ") || "Nobody";

  const tallyRows = [...tally.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/85">Reveal</p>
        <dl className="mt-6 space-y-5 text-lg">
          <div>
            <dt className="text-sm text-slate-500">Spy</dt>
            <dd className="mt-2 text-2xl font-bold text-red-400">{spyName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Location</dt>
            <dd className="mt-2 text-2xl font-bold text-teal-300">{room.location ?? "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Most votes went to</dt>
            <dd className="mt-2 text-xl font-semibold text-sky-300">{topNames}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Winner</dt>
            <dd className="mt-4 text-xl font-semibold leading-relaxed">
              {groupWins ? (
                <span className="text-emerald-400">Players win — the spy received the most votes.</span>
              ) : (
                <span className="text-amber-300">Spy wins — the group did not single out the spy.</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vote breakdown</h3>
        <ul className="mt-3 divide-y divide-slate-800 text-base">
          {tallyRows.length === 0 && <li className="py-3 text-slate-500">No votes recorded.</li>}
          {tallyRows.map(([id, n]) => {
            const nm = players.find((p) => p.id === id)?.name ?? id.slice(0, 8);
            return (
              <li key={id} className="flex justify-between gap-4 py-3 font-medium text-slate-200">
                <span>{nm}</span>
                <span className="tabular-nums text-slate-400">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {isHost && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onNewRound?.()}
          className="w-full rounded-xl bg-violet-500 py-5 text-xl font-bold text-violet-950 disabled:opacity-40"
        >
          New round
        </button>
      )}
      {!isHost && (
        <p className="text-center text-sm text-slate-500">Hang tight — the host can begin a new round.</p>
      )}
    </div>
  );
}
