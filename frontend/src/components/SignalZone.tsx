import { useEffect, useState, useCallback, useRef } from 'react';
import { usePulseGame } from '../hooks/usePulseGame';
import { useReactivity } from '../hooks/useReactivity';
import { playHum, playSnap, playVictory, playDefeat, playBuzzer, ensureAudio } from '../lib/audio';
import { useToast } from './Toast';

type UIState = 'WAITING' | 'FIRE' | 'REACTED' | 'ASYNC_RESOLVE' | 'RESULT';

export function SignalZone({ duelId }: { duelId: string }) {
    const { submitReaction, account, getDuel } = usePulseGame();
    const { isArmed, gameResult, isFalseStart } = useReactivity(duelId);
    const { toast } = useToast();

    const [humHandle, setHumHandle] = useState<{ stop: () => void } | null>(null);
    const [uiState, setUIState] = useState<UIState>('WAITING');
    const [hasReacted, setHasReacted] = useState(false);
    const [reactionSent, setReactionSent] = useState(false); // double-tap guard

    // Polling fallback
    const [polledArmed, setPolledArmed] = useState(false);
    const [polledResult, setPolledResult] = useState<any | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Honest resolve timer
    const resolveStartRef = useRef<number>(0);
    const [resolveElapsed, setResolveElapsed] = useState(0);

    // Confetti particles
    const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([]);

    useEffect(() => {
        pollingRef.current = setInterval(async () => {
            const duel = await getDuel(duelId);
            if (!duel) return;
            if (duel.state === 2 && !polledArmed) {
                console.log('[Poll] Duel armed detected via polling');
                setPolledArmed(true);
            }
            if (duel.state === 3 && !polledResult) {
                console.log('[Poll] Duel resolved detected via polling');
                setPolledResult({ winner: duel.winner, clientReactionMs: 0 });
            }
        }, 3000);
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [duelId]);

    const effectiveArmed = isArmed || polledArmed;
    const effectiveResult = gameResult || polledResult;
    const effectiveFalseStart = isFalseStart;

    useEffect(() => {
        if (effectiveResult) {
            setUIState('RESULT');
            if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (hasReacted && effectiveArmed) {
            setUIState('ASYNC_RESOLVE');
        } else if (effectiveArmed && !hasReacted) {
            setUIState('FIRE');
        } else if (effectiveFalseStart) {
            setUIState('RESULT');
            if (pollingRef.current) clearInterval(pollingRef.current);
        } else {
            setUIState('WAITING');
        }
    }, [effectiveArmed, effectiveResult, effectiveFalseStart, hasReacted]);

    // Audio: hum during WAITING
    useEffect(() => {
        if (uiState === 'WAITING') {
            const handle = playHum();
            setHumHandle(handle);
        }
        return () => {
            if (humHandle) { humHandle.stop(); setHumHandle(null); }
        };
    }, [uiState]);

    // Audio: snap on FIRE
    useEffect(() => {
        if (uiState === 'FIRE') {
            if (humHandle) { humHandle.stop(); setHumHandle(null); }
            playSnap();
        }
    }, [uiState]);

    // Audio + effects on RESULT
    useEffect(() => {
        if (uiState === 'RESULT') {
            if (effectiveFalseStart) {
                playBuzzer();
            } else {
                const isWinner = effectiveResult?.winner?.toLowerCase() === account?.toLowerCase();
                if (isWinner) {
                    playVictory();
                    setConfetti(Array.from({ length: 40 }, (_, i) => ({
                        id: i,
                        x: Math.random() * 100,
                        color: ['var(--green)', 'var(--gold)', 'var(--cyan)', 'var(--magenta)', '#fff'][Math.floor(Math.random() * 5)],
                        delay: Math.random() * 0.8,
                        size: 4 + Math.random() * 8,
                    })));
                } else {
                    playDefeat();
                }
            }
        }
    }, [uiState]);

    // Honest progress tracking for ASYNC_RESOLVE
    useEffect(() => {
        if (uiState === 'ASYNC_RESOLVE') {
            resolveStartRef.current = performance.now();
            const tick = setInterval(() => {
                setResolveElapsed(performance.now() - resolveStartRef.current);
            }, 100);
            return () => clearInterval(tick);
        } else {
            setResolveElapsed(0);
        }
    }, [uiState]);

    const handleReact = useCallback(() => {
        if (reactionSent) return; // DOUBLE-TAP GUARD
        setReactionSent(true);
        ensureAudio();
        submitReaction(duelId).catch((err: any) => {
            toast('REACTION FAILED — ' + (err?.shortMessage || err?.message || 'UNKNOWN ERROR'), 'error');
            setReactionSent(false);
        });
        setHasReacted(true);
    }, [duelId, submitReaction, reactionSent, toast]);

    // ═══ RESULT ═══
    if (uiState === 'RESULT') {
        const isWinner = effectiveResult?.winner?.toLowerCase() === account?.toLowerCase();
        return (
            <div className="flex-center column pixel-in" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                {confetti.map(p => (
                    <div key={p.id} style={{
                        position: 'fixed', left: `${p.x}%`, top: '-20px',
                        width: `${p.size}px`, height: `${p.size}px`, background: p.color,
                        animation: `confetti-fall ${2 + Math.random() * 2}s linear ${p.delay}s forwards`,
                        zIndex: 50, pointerEvents: 'none',
                    }} />
                ))}

                <div style={{
                    position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
                    background: effectiveFalseStart ? 'rgba(255,0,64,0.15)' : isWinner ? 'rgba(57,255,20,0.1)' : 'rgba(255,225,77,0.05)',
                    animation: 'result-flash 0.5s ease-out',
                }} />

                <h1 className="title-display neon-glow" style={{
                    color: effectiveFalseStart ? 'var(--red)' : (isWinner ? 'var(--green)' : 'var(--gold)'),
                    fontSize: effectiveFalseStart ? '4rem' : '6rem',
                    letterSpacing: '0.4rem',
                    animation: 'result-slam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}>
                    {effectiveFalseStart ? "DISQUALIFIED" : (isWinner ? "YOU WIN" : "GAME OVER")}
                </h1>

                {effectiveFalseStart && (
                    <div style={{
                        marginTop: '1.5rem', padding: '1.5rem 2rem',
                        border: '2px solid var(--red)', background: 'rgba(255,0,64,0.1)', maxWidth: '500px',
                    }}>
                        <p className="stat-label" style={{ color: 'var(--red)', marginBottom: '0.8rem' }}>FALSE START DETECTED</p>
                        <p style={{ fontSize: '0.8rem', lineHeight: '1.6', opacity: 0.8 }}>
                            You reacted before the signal fired. Your opponent wins the full stake.
                            Wait for the green FIRE flash before pressing react.
                        </p>
                    </div>
                )}

                {!effectiveFalseStart && (
                    <div className="panel" style={{ marginTop: '2rem', minWidth: '400px', border: '4px solid var(--purple)' }}>
                        <div className="panel-header-strip" style={{ background: isWinner ? 'var(--green)' : 'var(--purple)' }} />
                        <span className="stat-label">REACTION TIME</span>
                        <div style={{ marginTop: '1rem' }}>
                            <p className="numeric" style={{
                                fontSize: '5rem',
                                color: isWinner ? 'var(--green)' : 'var(--gold)',
                                animation: 'score-count 0.8s ease-out forwards',
                            }}>
                                {effectiveResult?.clientReactionMs ? Math.round(effectiveResult.clientReactionMs) : '---'}
                                <span style={{ fontSize: '1rem', marginLeft: '10px' }}>MS</span>
                            </p>
                        </div>
                        {isWinner && (
                            <div className="arcade-blink" style={{ color: 'var(--green)', fontSize: '0.6rem', marginTop: '1rem', fontFamily: 'var(--font-display)' }}>
                                WINNER TAKES THE POT
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '3rem' }}>
                    <button className="btn-precision" onClick={() => window.location.href = '/lobby'}>
                        CONTINUE? [Y/N]
                    </button>
                </div>
            </div>
        );
    }

    // ═══ ASYNC_RESOLVE ═══
    if (uiState === 'ASYNC_RESOLVE') {
        const elapsed = Math.round(resolveElapsed / 1000);
        return (
            <div className="flex-center column pixel-in">
                <h1 className="title-display" style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '3rem' }}>
                    VERIFYING ON CHAIN...
                </h1>
                <div className="numeric" style={{ fontSize: '3rem', color: 'var(--cyan)', marginBottom: '2rem' }}>{elapsed}s</div>
                <div style={{
                    width: '400px', height: '20px', border: '4px solid var(--purple)',
                    background: 'var(--bg-deep)', padding: '2px', position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', width: '60px', height: '100%',
                        background: 'linear-gradient(90deg, transparent, var(--magenta), transparent)',
                        animation: 'scanner-sweep 1.5s ease-in-out infinite',
                    }} />
                </div>
                <p className="stat-label" style={{ marginTop: '2rem', opacity: 0.8 }}>
                    SOMNIA BLOCK CONFIRMATION :: ID {duelId.slice(0, 8)}...
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.6rem', opacity: 0.4 }}>
                    Reactivity is resolving the winner on-chain
                </p>
            </div>
        );
    }

    // ═══ FIRE ═══
    if (uiState === 'FIRE') {
        return (
            <div className="flex-center column" style={{ position: 'relative' }}>
                <style>{`
                  @keyframes target-expand {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                  }
                `}</style>

                <div style={{
                    position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
                    animation: 'fire-flash 0.3s ease-out forwards',
                }} />

                <div style={{ position: 'relative', width: '300px', height: '300px' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '10px solid var(--green)', borderRadius: '50%', animation: 'target-expand 0.5s infinite', opacity: 0.6 }} />
                    <div style={{ position: 'absolute', inset: '20px', border: '6px solid var(--green)', borderRadius: '50%', animation: 'target-expand 0.5s 0.15s infinite', opacity: 0.4 }} />
                    <div style={{ position: 'absolute', inset: '40px', border: '3px solid var(--green)', borderRadius: '50%', opacity: 0.3 }} />

                    <button
                        className="btn-precision"
                        style={{
                            width: '100%', height: '100%', borderRadius: '50%', fontSize: '3rem',
                            borderColor: 'var(--green)',
                            color: reactionSent ? 'var(--cyan)' : 'var(--green)',
                            background: 'rgba(57, 255, 20, 0.1)',
                            boxShadow: '0 0 50px var(--green), 0 0 100px rgba(57,255,20,0.3)',
                        }}
                        onClick={handleReact}
                        disabled={reactionSent}
                    >
                        {reactionSent ? 'SENT!' : 'FIRE'}
                    </button>
                </div>
                <h1 className="title-display arcade-blink" style={{ fontSize: '2rem', color: 'var(--green)', marginTop: '3rem' }}>REACT NOW!</h1>
            </div>
        );
    }

    // ═══ WAITING ═══
    return (
        <div className="flex-center column pixel-in">
            <style>{`
              @keyframes scan-glow {
                0% { border-color: var(--purple); }
                50% { border-color: var(--red); }
                100% { border-color: var(--purple); }
              }
            `}</style>
            <div style={{
                width: '350px', height: '350px', border: '8px solid var(--purple)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'scan-glow 2s infinite steps(4)', flexDirection: 'column',
                background: 'rgba(0,0,0,0.3)', boxShadow: 'inset 0 0 60px rgba(123, 45, 255, 0.2)',
            }}>
                <div className="arcade-blink" style={{ color: 'var(--red)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', marginBottom: '2rem' }}>
                    [ SYSTEM ARMED ]
                </div>
                <h2 className="title-display" style={{ fontSize: '1.2rem', color: 'var(--purple)' }}>WAITING...</h2>
                <div style={{ marginTop: '2rem', width: '200px', height: '4px', background: 'var(--purple)', opacity: 0.3 }}>
                    <div style={{ width: '40%', height: '100%', background: 'var(--magenta)', animation: 'marquee 2s linear infinite' }} />
                </div>
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <div style={{
                    padding: '1rem 2rem', border: '2px solid var(--red)',
                    background: 'rgba(255, 0, 64, 0.08)', marginBottom: '1.5rem',
                }}>
                    <p className="stat-label" style={{ color: 'var(--red)', fontSize: '0.55rem' }}>
                        DO NOT REACT YET — WAIT FOR GREEN FLASH
                    </p>
                    <p style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.5rem' }}>
                        Early reaction = instant disqualification + full stake loss
                    </p>
                </div>
                <div
                    className="btn-precision"
                    style={{ borderColor: 'var(--red)', color: 'var(--red)', fontSize: '0.4rem', opacity: 0.3 }}
                    onClick={handleReact}
                >
                    TEST_TRIGGER
                </div>
            </div>
        </div>
    );
}
