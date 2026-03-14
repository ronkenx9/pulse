import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';

export interface LeaderEntry {
  rank: number;
  address: string;
  shortAddr: string;
  elo: number;
  wins: number;
  losses: number;
}

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });

const DUEL_RESOLVED_ABI = parseAbiItem(
  'event DuelResolved(uint256 indexed duelId, address winner, address loser, uint256 winnerBlock, uint256 loserBlock)'
);

export function useLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;

        const logs = await publicClient.getLogs({
          address: PULSE_GAME_ADDRESS as `0x${string}`,
          event: DUEL_RESOLVED_ABI,
          fromBlock,
          toBlock: currentBlock,
        });

        if (cancelled) return;

        // Aggregate wins/losses per address
        const stats = new Map<string, { wins: number; losses: number }>();
        for (const log of logs) {
          const { winner, loser } = log.args as { winner: `0x${string}`; loser: `0x${string}` };
          const w = winner.toLowerCase();
          const l = loser.toLowerCase();
          if (!stats.has(w)) stats.set(w, { wins: 0, losses: 0 });
          if (!stats.has(l)) stats.set(l, { wins: 0, losses: 0 });
          stats.get(w)!.wins++;
          stats.get(l)!.losses++;
        }

        if (stats.size === 0) {
          setLeaders([]);
          setLoading(false);
          return;
        }

        // Fetch ELO for each unique address
        const addresses = Array.from(stats.keys());
        const eloResults = await Promise.allSettled(
          addresses.map(addr =>
            publicClient.readContract({
              address: PULSE_GAME_ADDRESS as `0x${string}`,
              abi: pulseGameAbi,
              functionName: 'getElo',
              args: [addr as `0x${string}`],
            })
          )
        );

        const leaderData: LeaderEntry[] = addresses.map((addr, i) => {
          const s = stats.get(addr)!;
          const elo = eloResults[i].status === 'fulfilled'
            ? Number(eloResults[i].value as bigint)
            : 1000;
          return {
            rank: 0,
            address: addr,
            shortAddr: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
            elo,
            wins: s.wins,
            losses: s.losses,
          };
        });

        // Sort by ELO desc, assign ranks
        leaderData.sort((a, b) => b.elo - a.elo);
        leaderData.forEach((e, i) => { e.rank = i + 1; });

        if (!cancelled) setLeaders(leaderData.slice(0, 20));
      } catch (err) {
        console.error('useLeaderboard error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { leaders, loading };
}
