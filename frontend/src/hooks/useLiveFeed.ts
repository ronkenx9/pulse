import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS } from '../lib/contracts';

export interface FeedEntry {
  id: string;
  time: string;
  winner: string;
  loser: string;
  isFalseStart: boolean;
  stake?: string;
}

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });

const DUEL_RESOLVED_ABI = parseAbiItem(
  'event DuelResolved(uint256 indexed duelId, address winner, address loser, uint256 winnerBlock, uint256 loserBlock)'
);

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}..${addr.slice(-4)}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export function useLiveFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
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

        const parsed: FeedEntry[] = logs.reverse().slice(0, 20).map(log => {
          const { winner, loser, loserBlock } = log.args as {
            winner: `0x${string}`;
            loser: `0x${string}`;
            loserBlock: bigint;
          };
          // False start: loser reacted before winner (winnerBlock < loserBlock means loser went early)
          // Actually: winner got it first so winnerBlock <= loserBlock; 0 loserBlock = false start
          const isFalseStart = loserBlock === 0n;
          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            time: formatTime(Date.now()), // block timestamp not easily available without extra call
            winner: shortAddr(winner),
            loser: shortAddr(loser),
            isFalseStart,
          };
        });

        setEntries(parsed);
      } catch (err) {
        console.error('useLiveFeed error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    // Poll every 15s for new events
    const interval = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { entries, loading };
}
