import type { Vote } from "../types";

export interface VoteOutcome {
  tally: Map<string, number>;
  topVotedIds: string[];
  maxVotes: number;
  groupWins: boolean;
}

export function tallyVotes(spyId: string, votes: Vote[]): VoteOutcome {
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
  const groupWins = topVotedIds[0] === spyId;
  return { tally, topVotedIds, maxVotes, groupWins };
}
