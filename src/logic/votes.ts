import type { Vote } from "../types";

export interface VoteOutcome {
  tally: Map<string, number>;
  topVotedIds: string[];
  maxVotes: number;
  groupWins: boolean;
}

/** Group wins if there is exactly one plurality target and that player was a spy. */
export function tallyVotes(spyIds: readonly string[], votes: Vote[]): VoteOutcome {
  const spySet = new Set(spyIds);
  const tally = new Map<string, number>();
  for (const v of votes) {
    tally.set(v.votedPlayerId, (tally.get(v.votedPlayerId) ?? 0) + 1);
  }
  let maxVotes = 0;
  for (const n of tally.values()) {
    maxVotes = Math.max(maxVotes, n);
  }
  const topVotedIds = [...tally.entries()]
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id);
  if (maxVotes === 0 || topVotedIds.length !== 1) {
    return { tally, topVotedIds, maxVotes, groupWins: false };
  }
  const groupWins = spySet.has(topVotedIds[0]!);
  return { tally, topVotedIds, maxVotes, groupWins };
}
