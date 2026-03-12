import { useCallback } from 'react';
import { createPublicClient, http, encodeFunctionData } from 'viem';
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
      // Result is tuple: [player1, player2, stake, signalBlock, winner, state]
      const [player1, player2, stake, signalBlock, winner, state] = result as [
        `0x${string}`, `0x${string}`, bigint, bigint, `0x${string}`, number
      ];
      return { player1, player2, stake, signalBlock, winner, state: state as DuelState };
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
      // Result is tuple: [wins, losses, duelsPlayed]
      const [wins, losses, duelsPlayed] = result as [bigint, bigint, bigint];
      return { wins, losses, duelsPlayed };
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
      return elo as bigint;
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

      // After joining, schedule armSignal via Cron (logged for now — handled on-chain via Reactivity)
      const randomDelayMs = Math.floor(Math.random() * 6000) + 2000; // 2-8s
      const calldata = encodeFunctionData({
        abi: pulseGameAbi,
        functionName: 'armSignal',
        args: [BigInt(duelId)]
      });
      console.log(`[PULSE] Duel ${duelId} joined. armSignal calldata ready (delay ${randomDelayMs}ms):`, calldata);

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
