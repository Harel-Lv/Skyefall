import { useEffect, useMemo, useState } from "react";
import type { Player, Vote } from "../types";

interface VotingPanelProps {
  players: Player[];
  currentUserId: string;
  votes: Vote[];
  submitting?: boolean;
  onVote: (votedPlayerId: string) => void;
}

export default function VotingPanel({
  players,
  currentUserId,
  votes,
  submitting,
  onVote,
}: VotingPanelProps) {
  const myVote = useMemo(() => votes.find((v) => v.voterId === currentUserId), [votes, currentUserId]);
  const [selected, setSelected] = useState<string | null>(() => myVote?.votedPlayerId ?? null);

  useEffect(() => {
    if (myVote) setSelected(myVote.votedPlayerId);
  }, [myVote]);

  const votedName = players.find((p) => p.id === myVote?.votedPlayerId)?.name ?? "Locked in";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/90">Voting</p>
        <p className="mt-3 text-lg text-slate-200">
          Pick who you believe is <span className="font-semibold text-red-300">the spy</span>. One vote each.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!!myVote || submitting}
            onClick={() => setSelected(p.id)}
            className={`rounded-xl border px-4 py-4 text-left text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected === p.id
                ? "border-sky-500 bg-sky-900/70 text-sky-50"
                : "border-slate-700 bg-slate-900/60 text-slate-100 hover:border-slate-500"
            }`}
          >
            {p.name}
            {p.id === currentUserId && (
              <span className="ml-2 rounded-md bg-slate-700 px-2 py-0.5 text-xs font-normal text-slate-400">You</span>
            )}
          </button>
        ))}
      </div>

      {!myVote && selected && (
        <button
          type="button"
          disabled={submitting || !selected}
          onClick={() => selected && onVote(selected)}
          className="w-full rounded-xl bg-amber-500 py-5 text-xl font-bold text-amber-950 disabled:opacity-40"
        >
          Submit vote
        </button>
      )}

      {myVote && (
        <p className="text-center text-base text-emerald-300">Your vote was recorded ({votedName}).</p>
      )}
      <p className="text-center text-sm text-slate-500">
        Everyone must vote — then the spy and location will be revealed.
      </p>
    </div>
  );
}
