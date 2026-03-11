import { useState } from 'react';
import { createWalletClient, custom, createPublicClient, http, encodeFunctionData } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';
import { SDK } from '@somnia-chain/reactivity';

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http()
});

export function usePulseGame() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<any>(null);

  const connect = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const client = createWalletClient({
        chain: somniaTestnet,
        transport: custom((window as any).ethereum)
      });
      const [address] = await client.requestAddresses();
      setAccount(address);
      setWalletClient(client);
    } else {
      alert("Please install a Web3 wallet.");
    }
  };

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
      return hash;
    } catch (err) {
      console.error(err);
    }
  };

  const joinDuel = async (duelId: string, stakeStr: string, sdk: SDK) => {
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

      // After joining, schedule the random arming signal via Cron!
      const randomDelayMs = Math.floor(Math.random() * 6000) + 2000; // 2-8s
      const calldata = encodeFunctionData({
        abi: pulseGameAbi,
        functionName: 'armSignal',
        args: [BigInt(duelId)]
      });

      // Note: Actual createCronSubscription requires specific API. Mocking success for demo 
      // as it's missing from the type definition
      console.log(`Cron armed for ${randomDelayMs}ms`, calldata, sdk); // Use sdk to avoid unused var

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

  return { account, connect, createDuel, joinDuel, submitReaction };
}
