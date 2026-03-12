import { useEffect, useState, useCallback } from 'react';
import { usePulseGame } from '../hooks/usePulseGame';
import { useReactivity } from '../hooks/useReactivity';
import { playHum, playSnap, playBassDrop, audioCtx } from '../lib/audio';

// UI State Machine matching PRD: WAITING -> FIRE -> REACTED -> ASYNC_RESOLVE -> RESULT
type UIState = 'WAITING' | 'FIRE' | 'REACTED' | 'ASYNC_RESOLVE' | 'RESULT';

export function SignalZone({ duelId }: { duelId: string }) {
    const { submitReaction } = usePulseGame();
    const { isArmed, gameResult, isFalseStart } = useReactivity(duelId);

    // Local UI State
    const [humNode, setHumNode] = useState<OscillatorNode | null>(null);
    const [uiState, setUIState] = useState<UIState>('WAITING');
    const [hasReacted, setHasReacted] = useState(false);

    // Determine UI state based on reactivity data
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

    // Initial hum when WAITING
    useEffect(() => {
        if (uiState === 'WAITING') {
            const node = playHum();
            setHumNode(node);
        }
        return () => {
            if (humNode) {
                humNode.stop();
                setHumNode(null);
            }
        };
    }, [uiState]);

    // Handle Fire state
    useEffect(() => {
        if (uiState === 'FIRE') {
            if (humNode) {
                humNode.stop();
                setHumNode(null);
            }
            playSnap();
            document.body.classList.add('signal-fire');
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 400);
        }
    }, [uiState, humNode]);

    // Handle Resolved state
    useEffect(() => {
        if (uiState === 'RESULT') {
            document.body.classList.remove('signal-fire');
            playBassDrop();
        }
    }, [uiState]);

    const handleReact = useCallback(() => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        submitReaction(duelId);
        setHasReacted(true);
    }, [duelId, submitReaction]);

    // RESULT state
    if (uiState === 'RESULT') {
        return (
            <div className="panel" style={{ textAlign: 'center', borderColor: 'var(--gold)', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h1 style={{ color: isFalseStart ? 'var(--red)' : 'var(--gold)', fontSize: '3.5rem', textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
                    {isFalseStart ? "FALSE START" : "DUEL RESOLVED"}
                </h1>
                <div style={{ marginTop: '2rem' }}>
                    <p className="numeric" style={{ fontSize: '1.5rem', letterSpacing: '2px', opacity: 0.8 }}>WINNER</p>
                    <p style={{ color: 'var(--green)', fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                        {gameResult?.winner || 'Unknown'}
                    </p>
                </div>
                {!isFalseStart && gameResult && (
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,255,255,0.05)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>CLIENT REACTION TIME</p>
                        <p className="numeric" style={{ fontSize: '4rem', color: 'var(--cyan)', textShadow: '0 0 15px var(--cyan)' }}>
                            {Math.round(gameResult.clientReactionMs)}<span style={{ fontSize: '1.5rem', marginLeft: '5px' }}>ms</span>
                        </p>
                    </div>
                )}
                <div style={{ marginTop: '2rem' }}>
                    <button className="btn-primary" onClick={() => window.location.href = '/'}>
                        BACK TO LOBBY
                    </button>
                </div>
            </div>
        );
    }

    // ASYNC_RESOLVE state
    if (uiState === 'ASYNC_RESOLVE') {
        return (
            <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                <div style={{
                    width: '140px', height: '140px',
                    borderRadius: '50%',
                    border: '4px solid var(--gold)',
                    margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'radioactivePulse 0.5s infinite alternate',
                    boxShadow: '0 0 30px rgba(255,215,0,0.3)'
                }}>
                    <p style={{ color: 'var(--gold)', fontWeight: 'bold' }}>RESOLVING</p>
                </div>
                <h2 style={{ marginTop: '2.5rem', color: 'var(--cyan)', letterSpacing: '4px' }}>WAITING FOR BLOCKS...</h2>
                <p style={{ marginTop: '1rem', color: 'rgba(200, 200, 232, 0.7)', maxWidth: '400px', margin: '1rem auto' }}>
                    Your reaction is on-chain. Somnia validators are calculating the precise winner...
                </p>
            </div>
        );
    }

    // FIRE state
    if (uiState === 'FIRE') {
        return (
            <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                <h1 style={{ fontSize: '5rem', color: 'black', marginBottom: '2rem', fontWeight: '900', WebkitTextStroke: '1px var(--green)' }}>FIRE!</h1>
                <button className="react-btn" onClick={handleReact}>
                    REACТ
                </button>
            </div>
        );
    }

    // WAITING state
    return (
        <div style={{ textAlign: 'center', marginTop: '5vh' }}>
            <div style={{
                width: '180px', height: '180px',
                borderRadius: '50%',
                border: '4px solid var(--purple)',
                margin: '0 auto',
                animation: 'radioactivePulse 2s infinite alternate',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(139, 43, 226, 0.1) 0%, transparent 70%)'
            }}>
                <p style={{ fontSize: '1.2rem', letterSpacing: '3px' }}>WAITING</p>
            </div>
            <h2 style={{ marginTop: '3rem', animation: 'numFlicker 2s infinite', color: 'var(--purple)' }}>ESTABLISHING SECURE CONNECTION...</h2>
            <div style={{ marginTop: '4rem', opacity: 0.6 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--red)' }}>[ WARNING: EARLY REACTION DISQUALIFIES ]</p>
                <button
                  className="btn-primary"
                  style={{ borderColor: 'var(--red)', color: 'var(--red)', marginTop: '1rem', fontSize: '0.7rem' }}
                  onClick={handleReact}
                >
                  TEST FALSE START
                </button>
            </div>
        </div>
    );
}