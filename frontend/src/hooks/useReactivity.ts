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
              to: PULSE_GAME_ADDRESS as `0x${string}`, 
              abi: pulseGameAbi, 
              functionName: 'getDuel', 
              args: [BigInt(duelId)] 
            } as any
          ],
          onData: (data: any) => {
            if (disconnected) return;
            
            // Atomic state
            const duelState = data.ethCalls[0].result?.[5]; 
            
            if (data.event?.name === 'SignalFired') {
              const now = performance.now();
              setSignalTimestamp(now);
              setIsArmed(true);
            }
            
            if (data.event?.name === 'DuelResolved') {
              setSignalTimestamp((prevStamp) => {
                const now = performance.now();
                const clientReactionMs = prevStamp ? now - prevStamp : 0;
                setGameResult({ 
                  ...data.event.args, 
                  clientReactionMs 
                });
                return prevStamp;
              });
              
              if (duelState === 3 && !isArmed) { 
                 setIsFalseStart(true);
              }
            }
          }
        });
        if (sub && !('message' in sub)) {
          subId = (sub as any).id;
        }
      } catch (err) {
        console.error("Reactivity subscription failed:", err);
      }
    };

    connect();

    return () => {
      disconnected = true;
      if (subId) {
        // cleanup placeholder if available later
      }
    };
  }, [duelId, isArmed]);

  return { signalTimestamp, isArmed, gameResult, isFalseStart, sdk };
}
