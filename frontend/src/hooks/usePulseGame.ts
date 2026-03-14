import { useCallback } from 'react';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';
import { useWallet } from '../context/WalletContext';

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http()
});

// DuelState values matching the contract (using const object for TS erasableSyntaxOnly compat)
export const DuelState = {
  OPEN: 0,
  ARMED_PENDING: 1,
  ARMED: 2,
  RESOLVED: 3,
  CANCELLED: 4,
} as const;
export type DuelState = typeof DuelState[keyof typeof DuelState];

export interface Duel {
  player1: `0x${string}`;
  player2: `0x${string}`;
  stake: bigint;
  signalBlock: bigint;
  winner: `0x${string}`;
  state: DuelState;
}

export interface DuelRecord {
  wins: bigint;
  losses: bigint;
  duelsPlayed: bigint;
}

export function usePulseGame() {
  const { account, walletClient, connect } = useWallet();

  // Read: Get duel state by ID
  const getDuel = useCallback(async (duelId: string): Promise<Duel | null> => {
    try {
      const result = await publicClient.readContract({
        address: PULSE_GAME_ADDRESS as `0x${string}`,
        abi: pulseGameAbi,
        functionName: 'getDuel',
        args: [BigInt(duelId)]
      });

      // Viem may return as array or object depending on version/ABI style
      if (Array.isArray(result)) {
        const [player1, player2, stake, signalBlock, winner, state] = result;
        return { player1, player2, stake, signalBlock, winner, state: state as DuelState };
      } else {
        const r = result as any;
        return {
          player1: r.player1,
          player2: r.player2,
          stake: r.stake,
          signalBlock: r.signalBlock,
          winner: r.winner,
          state: r.state as DuelState
        };
      }
    } catch (err) {
      console.error('getDuel error:', err);
      return null;
    }
  }, []);

  // Read: Get player's duel record
  const getRecord = useCallback(async (player: `0x${string}`): Promise<DuelRecord | null> => {
    try {
      const result = await publicClient.readContract({
        address: PULSE_GAME_ADDRESS as `0x${string}`,
        abi: pulseGameAbi,
        functionName: 'getRecord',
        args: [player]
      });

      if (Array.isArray(result)) {
        const [wins, losses, duelsPlayed] = result;
        return { wins, losses, duelsPlayed };
      } else {
        const r = result as any;
        return { wins: r.wins, losses: r.losses, duelsPlayed: r.duelsPlayed };
      }
    } catch (err) {
      console.error('getRecord error:', err);
      return null;
    }
  }, []);

  // Read: Get player's ELO
  const getElo = useCallback(async (player: `0x${string}`): Promise<bigint | null> => {
    try {
      const elo = await publicClient.readContract({
        address: PULSE_GAME_ADDRESS as `0x${string}`,
        abi: pulseGameAbi,
        functionName: 'getElo',
        args: [player]
      });
      return BigInt(elo as string | number | bigint);
    } catch (err) {
      console.error('getElo error:', err);
      return null;
    }
  }, []);

  const createDuel = async (opponent: `0x${string}`, stakeStr: string) => {
    if (!walletClient || !account) return;
    try {
      const stake = BigInt(stakeStr);
      const hash = await walletClient.writeContract({
        address: PULSE_GAME_ADDRESS as `0x${string}`,
        abi: pulseGameAbi,
        functionName: 'createDuel',
        args: [opponent],
        value: stake,
        account
      });
      await publicClient.waitForTransactionReceipt({ hash });
      // duelCount == newly created duelId (contract does ++duelCount before returning)
      const count = await publicClient.readContract({
        address: PULSE_GAME_ADDRESS as `0x${string}`,
        abi: pulseGameAbi,
        functionName: 'duelCount',
        args: []
      });
      return (count as bigint).toString();
    } catch (err) {
      console.error(err);
    }
  };

  const armSignal = async (duelId: string) => {
    if (!walletClient || !account) return;
    try {
      const hash = await walletClient.writeContract({
        address: PULSE_GAME_ADDRESS as `0x${string}`,
        abi: pulseGameAbi,
        functionName: 'armSignal',
        args: [BigInt(duelId)],
        account
      });
      console.log(`[PULSE] armSignal tx: ${hash}`);
      return hash;
    } catch (err) {
      console.error('[PULSE] armSignal error:', err);
    }
  };

  const joinDuel = async (duelId: string, stakeStr: string) => {
    if (!walletClient || !account) return;
    try {
      const stake = BigInt(stakeStr);
      const hash = await walletClient.writeContract({
        address: PULSE_GAME_ADDRESS as `0x${string}`,
        abi: pulseGameAbi,
        functionName: 'joinDuel',
        args: [BigInt(duelId)],
        value: stake,
        account
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Fire signal after a random 2–4s delay so both players have time to see the WAITING screen
      const delay = Math.floor(Math.random() * 2000) + 2000;
      console.log(`[PULSE] Duel ${duelId} joined. Arming signal in ${delay}ms...`);
      setTimeout(() => armSignal(duelId), delay);

      return hash;
    } catch (err) {
      console.error(err);
    }
  };

  const submitReaction = async (duelId: string) => {
    if (!walletClient || !account) return;
    try {
      const hash = await walletClient.writeContract({
        address: PULSE_GAME_ADDRESS as `0x${string}`,
        abi: pulseGameAbi,
        functionName: 'submitReaction',
        args: [BigInt(duelId)],
        account
      });
      // Do not wait for receipt in UI because state shifts fast
      return hash;
    } catch (err) {
      console.error(err);
    }
  };

  return {
    account,
    connect,
    createDuel,
    joinDuel,
    submitReaction,
    getDuel,
    getRecord,
    getElo
  };
}
