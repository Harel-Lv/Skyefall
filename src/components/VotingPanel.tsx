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

  const votedName = players.find((p) => p.id === myVote?.votedPlayerId)?.name ?? "someone";

  const submittedVoterIds = useMemo(() => new Set(votes.map((v) => v.voterId)), [votes]);
  const votedCount = submittedVoterIds.size;
  const totalCount = players.length;
  const voteProgress = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

  const showDock = Boolean(!myVote && selected && players.length > 0);

  return (
    <div className={`space-y-4 ${showDock ? "max-sm:pb-28" : ""}`}>

      {/* Header with progress */}
      <div className="animate-fade-up rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-slate-950/50 p-5 shadow-lg shadow-black/25">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200/85">
            Voting booth
          </p>
          <p className="text-sm font-bold tabular-nums text-amber-100">
            {votedCount} / {totalCount}
          </p>
        </div>

        {/* progress bar */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out"
            style={{ width: `${voteProgress}%` }}
          />
        </div>

        <p className="mt-4 text-[1.05rem] font-medium leading-relaxed text-slate-200">
          {myVote ? (
            <>
              You voted for{" "}
              <span className="font-bold text-emerald-300">{votedName}</span> — locked in.
            </>
          ) : (
            <>
              Tap who you think is{" "}
              <span className="font-semibold text-red-300">a spy</span>.
            </>
          )}
        </p>
      </div>

      {/* Player list */}
      <ul className="grid grid-cols-1 gap-2.5">
        {players.map((p) => {
          const isSelf = p.id === currentUserId;
          const isPick = selected === p.id;
          const hasVoted = submittedVoterIds.has(p.id);

          const cardStyle = isPick
            ? "border-sky-400/80 bg-gradient-to-br from-sky-900/90 to-slate-950 ring-2 ring-sky-400/50 shadow-lg shadow-sky-950/25"
            : "border-slate-700/80 bg-slate-950/55 shadow-sm shadow-black/20";

          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={Boolean(myVote || submitting)}
                onClick={() => setSelected(p.id)}
                className={`touch-hit flex min-h-[3.6rem] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors disabled:opacity-55 ${cardStyle}`}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="truncate text-[1.05rem] font-semibold text-slate-50">
                    {p.name}
                  </span>
                  {isSelf && (
                    <span className="shrink-0 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      You
                    </span>
                  )}
                </span>

                <span className="shrink-0 flex items-center gap-2">
                  {hasVoted && !isSelf && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      voted
                    </span>
                  )}
                  {!myVote && isPick ? (
                    <span className="text-sm font-bold text-sky-200">✓</span>
                  ) : !myVote && !isPick ? (
                    <span className="text-slate-600 text-sm" aria-hidden>›</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Submit button — desktop inline, mobile sticky dock */}
      {showDock ? (
        <>
          <button
            type="button"
            disabled={submitting || !selected}
            onClick={() => selected && onVote(selected)}
            className="touch-hit hidden min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 py-3.5 text-lg font-bold text-amber-950 shadow-lg shadow-amber-950/35 transition-[filter] active:brightness-95 disabled:opacity-40 sm:flex"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-950/40 border-t-amber-950" aria-hidden />
            )}
            Submit vote
          </button>

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 pb-safe pt-10 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent sm:hidden">
            <div className="pointer-events-auto mx-auto max-w-md px-4">
              <button
                type="button"
                disabled={submitting || !selected}
                onClick={() => selected && onVote(selected)}
                className="touch-hit flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 py-3.5 text-lg font-bold text-amber-950 shadow-[0_-16px_40px_-8px_rgba(0,0,0,0.6)] shadow-amber-950/35 transition-[filter] active:brightness-95 disabled:opacity-40"
              >
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-950/40 border-t-amber-950" aria-hidden />
                )}
                Submit vote
              </button>
            </div>
          </div>
        </>
      ) : null}

      {!myVote && !selected ? (
        <p className="text-center text-sm text-slate-500">Tap a name above, then confirm below.</p>
      ) : null}

      <p className="text-center text-xs leading-relaxed text-slate-600">
        Highest-voted player vs. actual spy decides the winner
      </p>
    </div>
  );
}
