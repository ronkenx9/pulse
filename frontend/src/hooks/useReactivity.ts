import { useState, useEffect, useRef } from 'react';
import { SDK } from '@somnia-chain/reactivity';
import { createPublicClient, http, keccak256, toHex } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http()
});

const sdk = new SDK({ public: publicClient });

// Pre-compute event topic hashes for reliable matching
const TOPIC_SIGNAL_FIRED = keccak256(toHex('SignalFired(uint256,uint256)'));
const TOPIC_DUEL_RESOLVED = keccak256(toHex('DuelResolved(uint256,address,address,uint256,uint256)'));
// Used by setup-subscription.ts; kept for reference
// const TOPIC_REACTION_SUBMITTED = keccak256(toHex('ReactionSubmitted(uint256,address)'));

export function useReactivity(duelId: string | null) {
  const [signalTimestamp, setSignalTimestamp] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<any | null>(null);
  const [isArmed, setIsArmed] = useState(false);
  const [isFalseStart, setIsFalseStart] = useState(false);

  // Use refs so callbacks always see latest values without re-subscribing
  const isArmedRef = useRef(false);
  const signalTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!duelId) return;

    let disconnected = false;
    const duelIdBig = BigInt(duelId);

    const connect = async () => {
      try {
        const sub = await sdk.subscribe({
          eventContractSources: [PULSE_GAME_ADDRESS],
          ethCalls: [
            {
              to: PULSE_GAME_ADDRESS as `0x${string}`,
              abi: pulseGameAbi,
              functionName: 'getDuel',
              args: [duelIdBig]
            } as any
          ],
          onData: (data: any) => {
            if (disconnected) return;

            // --- Derive state from ethCall result ---
            const result = data.ethCalls?.[0]?.result;
            const duelState = Array.isArray(result) ? Number(result[5]) : Number(result?.state);

            // If contract already in ARMED state, force UI armed
            if (duelState === 2 && !isArmedRef.current) {
              isArmedRef.current = true;
              signalTimestampRef.current = performance.now();
              setSignalTimestamp(signalTimestampRef.current);
              setIsArmed(true);
            }

            // --- Process event if present ---
            const event = data.event;
            if (!event) return;

            // Match event by name OR by topic[0] hash (SDK may not always parse name)
            const topic0 = event.topics?.[0];
            const eventDuelId = event.args?.duelId ?? (event.topics?.[1] ? BigInt(event.topics[1]) : null);

            // CRITICAL: Filter events to only this duel
            if (eventDuelId !== null && eventDuelId !== undefined && BigInt(eventDuelId) !== duelIdBig) {
              return; // Event is for a different duel, ignore
            }

            // --- SignalFired ---
            if (event.name === 'SignalFired' || topic0 === TOPIC_SIGNAL_FIRED) {
              if (!isArmedRef.current) {
                const now = performance.now();
                isArmedRef.current = true;
                signalTimestampRef.current = now;
                setSignalTimestamp(now);
                setIsArmed(true);
              }
            }

            // --- DuelResolved ---
            if (event.name === 'DuelResolved' || topic0 === TOPIC_DUEL_RESOLVED) {
              const now = performance.now();
              const clientReactionMs = signalTimestampRef.current
                ? now - signalTimestampRef.current
                : 0;

              setGameResult({
                ...event.args,
                clientReactionMs
              });

              // False start: resolved without signal ever firing
              if (!isArmedRef.current) {
                setIsFalseStart(true);
              }
            }
          }
        });

        // Log subscription status for debugging
        if (sub && !('message' in sub)) {
          console.log('[Reactivity] Subscribed for duel', duelId, 'sub:', (sub as any).id);
        } else if (sub && 'message' in sub) {
          console.warn('[Reactivity] Subscription warning:', (sub as any).message);
        }
      } catch (err) {
        console.error('[Reactivity] Subscription failed:', err);
      }
    };

    connect();

    return () => {
      disconnected = true;
    };
  }, [duelId]); // Only re-subscribe when duelId changes, NOT when isArmed changes

  return { signalTimestamp, isArmed, gameResult, isFalseStart, sdk };
}
