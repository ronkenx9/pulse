import { useState, useEffect } from 'react';
import { SDK } from '@somnia-chain/reactivity';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';

const publicClient = createPublicClient({ 
    chain: somniaTestnet, 
    transport: http() 
});

const sdk = new SDK({ public: publicClient });

export function useReactivity(duelId: string | null) {
  const [signalTimestamp, setSignalTimestamp] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<any | null>(null);
  const [isArmed, setIsArmed] = useState(false);
  const [isFalseStart, setIsFalseStart] = useState(false);

  useEffect(() => {
    if (!duelId) return;

    let subId: string | null = null;
    let disconnected = false;

    const connect = async () => {
      try {
        const sub = await sdk.subscribe({
          ethCalls: [
            { 
              address: PULSE_GAME_ADDRESS as `0x${string}`, 
              abi: pulseGameAbi, 
              functionName: 'getDuel', 
              args: [BigInt(duelId)] 
            }
          ],
          onData: (data: any) => {
            if (disconnected) return;
            
            // Check atomic struct state
            const duelState = data.ethCalls[0].result?.[5]; // State enum index
            
            if (data.event?.name === 'SignalFired') {
              setSignalTimestamp(performance.now());
              setIsArmed(true);
            }
            
            if (data.event?.name === 'DuelResolved') {
              const clientReactionMs = signalTimestamp ? performance.now() - signalTimestamp : 0;
              setGameResult({ 
                ...data.event.args, 
                clientReactionMs 
              });
              
              if (duelState === 3 && !isArmed) { // RESOLVED but never ARMED
                 setIsFalseStart(true);
              }
            }
          }
        });
        subId = sub.id;
      } catch (err) {
        console.error("Reactivity subscription failed:", err);
      }
    };

    connect();

    return () => {
      disconnected = true;
      if (subId) {
        // SDK doesn't natively expose unsubscribe yet, this is a placeholder
        // sdk.unsubscribe(subId); 
      }
    };
  }, [duelId, signalTimestamp, isArmed]);

  return { signalTimestamp, isArmed, gameResult, isFalseStart, sdk };
}
