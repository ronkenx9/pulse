import { useEffect, useState, useCallback } from 'react';
import { usePulseGame } from '../hooks/usePulseGame';
import { useReactivity } from '../hooks/useReactivity';
import { playHum, playSnap, playBassDrop, ensureAudio } from '../lib/audio';

type UIState = 'WAITING' | 'FIRE' | 'REACTED' | 'ASYNC_RESOLVE' | 'RESULT';

export function SignalZone({ duelId }: { duelId: string }) {
    const { submitReaction } = usePulseGame();
    const { isArmed, gameResult, isFalseStart } = useReactivity(duelId);

    const [humHandle, setHumHandle] = useState<{ stop: () => void } | null>(null);
    const [uiState, setUIState] = useState<UIState>('WAITING');
    const [hasReacted, setHasReacted] = useState(false);

    useEffect(() => {
        if (gameResult) {
            setUIState('RESULT');
        } else if (hasReacted && isArmed) {
            setUIState('ASYNC_RESOLVE');
        } else if (isArmed && !hasReacted) {
            setUIState('FIRE');
        } else if (isFalseStart) {
            setUIState('RESULT');
        } else {
            setUIState('WAITING');
        }
    }, [isArmed, gameResult, isFalseStart, hasReacted]);

    useEffect(() => {
        if (uiState === 'WAITING') {
            const handle = playHum();
            setHumHandle(handle);
        }
        return () => {
            if (humHandle) {
                humHandle.stop();
                setHumHandle(null);
            }
        };
    }, [uiState]);

    useEffect(() => {
        if (uiState === 'FIRE') {
            if (humHandle) {
                humHandle.stop();
                setHumHandle(null);
            }
            playSnap();
        }
    }, [uiState]);

    useEffect(() => {
        if (uiState === 'RESULT') {
            playBassDrop();
        }
    }, [uiState]);

    const handleReact = useCallback(() => {
        ensureAudio();
        submitReaction(duelId);
        setHasReacted(true);
    }, [duelId, submitReaction]);

    if (uiState === 'RESULT') {
        const isWinner = gameResult?.winner?.toLowerCase() === account?.toLowerCase();

        return (
            <div className="flex-center column pixel-in" style={{ textAlign: 'center' }}>
                <style>{`
                  @keyframes confetti-fall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                  }
                `}</style>

                <h1 className="title-display neon-glow" style={{
                    color: isFalseStart ? 'var(--red)' : (isWinner ? 'var(--green)' : 'var(--gold)'),
                    fontSize: '6rem',
                    letterSpacing: '0.4rem'
                }}>
                    {isFalseStart ? "DQ!!" : (isWinner ? "YOU WIN" : "GAME OVER")}
                </h1>

                <div className="panel" style={{ marginTop: '2rem', minWidth: '400px', border: '4px solid var(--purple)' }}>
                    <div className="panel-header-strip" style={{ background: 'var(--purple)' }} />
                    <span className="stat-label">FINAL SCORE</span>
                    <div style={{ marginTop: '1rem' }}>
                        <p className="numeric" style={{ fontSize: '5rem', color: isWinner ? 'var(--green)' : 'var(--gold)' }}>
                            {gameResult ? Math.round(gameResult.clientReactionMs) : '000'}<span style={{ fontSize: '1rem', marginLeft: '10px' }}>MS</span>
                        </p>
                    </div>
                    {isWinner && (
                        <div className="arcade-blink" style={{ color: 'var(--green)', fontSize: '0.6rem', marginTop: '1rem', fontFamily: 'var(--font-display)' }}>
                            ★ NEW RANKING UNLOCKED ★
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '3rem' }}>
                    <button className="btn-precision" onClick={() => window.location.href = '/lobby'}>
                        CONTINUE? [Y/N]
                    </button>
                </div>
            </div>
        );
    }

    if (uiState === 'ASYNC_RESOLVE') {
        return (
            <div className="flex-center column pixel-in">
                <style>{`
                  @keyframes stepped-progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                  }
                `}</style>
                <h1 className="title-display" style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '3rem' }}>VERIFYING...</h1>
                <div style={{ width: '400px', height: '40px', border: '4px solid var(--bg-deep)', boxShadow: '0 0 0 4px var(--purple)', background: 'var(--bg-deep)', padding: '4px' }}>
                    <div style={{
                        height: '100%',
                        background: 'var(--magenta)',
                        animation: 'stepped-progress 2s steps(10) infinite forwards'
                    }} />
                </div>
                <p className="stat-label" style={{ marginTop: '2rem', opacity: 0.8 }}>SOMNIA BLOCK COMMITTAL ID: {duelId.slice(0, 8)}...</p>
            </div>
        );
    }

    if (uiState === 'FIRE') {
        return (
            <div className="flex-center column pulse-tensed">
                <style>{`
                  @keyframes target-expand {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                  }
                `}</style>
                <div style={{ position: 'absolute', inset: 0, background: 'var(--green)', opacity: 0.2, zIndex: -1, animation: 'blink 0.1s steps(2) 2' }} />

                <div style={{ position: 'relative', width: '300px', height: '300px' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '10px solid var(--green)', borderRadius: '50%', animation: 'target-expand 0.5s infinite' }} />
                    <div style={{ position: 'absolute', inset: '40px', border: '5px solid var(--green)', borderRadius: '50%', opacity: 0.5 }} />
                    <button
                        className="btn-precision"
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            fontSize: '3rem',
                            borderColor: 'var(--green)',
                            color: 'var(--green)',
                            background: 'rgba(57, 255, 20, 0.1)',
                            boxShadow: '0 0 50px var(--green)'
                        }}
                        onClick={handleReact}
                    >
                        FIRE
                    </button>
                </div>
                <h1 className="title-display arcade-blink" style={{ fontSize: '2rem', color: 'var(--green)', marginTop: '3rem' }}>REACT NOW!</h1>
            </div>
        );
    }

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
                width: '350px',
                height: '350px',
                border: '8px solid var(--purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'scan-glow 2s infinite steps(4)',
                flexDirection: 'column',
                background: 'rgba(0,0,0,0.3)',
                boxShadow: 'inset 0 0 60px rgba(123, 45, 255, 0.2)'
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
                <p className="stat-label" style={{ color: 'var(--red)', marginBottom: '1rem' }}>DONT JUMP THE GUN</p>
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

// Global account support inside SignalZone
import { useWallet } from '../context/WalletContext';
function SignalZoneWrapper(props: any) {
    const { account } = useWallet();
    return <SignalZone {...props} account={account} />;
}
export { SignalZoneWrapper as SignalZone };