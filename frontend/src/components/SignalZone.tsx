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
        return (
            <div className="flex-center column" style={{ textAlign: 'center' }}>
                <h1 className="title-display pulse-breathing" style={{ color: isFalseStart ? 'var(--red)' : 'var(--gold)', fontSize: '3.5rem' }}>
                    {isFalseStart ? "SYNC_LOSS" : "DUEL_END"}
                </h1>
                <div style={{ marginTop: '2rem' }}>
                    <span className="stat-label">VICTOR_ID</span>
                    <p style={{ color: 'var(--green)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                        {gameResult?.winner ? `${gameResult.winner.slice(0, 10)}...` : 'N/A'}
                    </p>
                </div>
                {!isFalseStart && gameResult && (
                    <div className="stat-box" style={{ marginTop: '2rem', borderColor: 'var(--cyan)' }}>
                        <span className="stat-label">NEURAL_RESPONSE_TIME</span>
                        <p className="numeric" style={{ fontSize: '4rem', color: 'var(--cyan)' }}>
                            {Math.round(gameResult.clientReactionMs)}<span style={{ fontSize: '1.5rem', marginLeft: '5px' }}>ms</span>
                        </p>
                    </div>
                )}
                <div style={{ marginTop: '3rem' }}>
                    <button className="btn-precision" onClick={() => window.location.href = '/lobby'}>
                        DISCONNECT_ARENA
                    </button>
                </div>
            </div>
        );
    }

    if (uiState === 'ASYNC_RESOLVE') {
        return (
            <div className="flex-center column">
                <div className="pulse-tensed" style={{
                    width: '140px', height: '140px',
                    borderRadius: '50%',
                    border: '4px solid var(--gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(255,215,0,0.3)'
                }}>
                    <div className="sonar-ping">
                        <div className="sonar-ring" style={{ borderColor: 'var(--gold)' }} />
                    </div>
                    <p className="title-display" style={{ color: 'var(--gold)', fontSize: '0.7rem' }}>SYNCING</p>
                </div>
                <h2 className="title-display" style={{ marginTop: '2.5rem', color: 'var(--cyan)', fontSize: '1rem' }}>BLOCK_VALIDATION...</h2>
                <p style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.7rem', maxWidth: '300px', textAlign: 'center', letterSpacing: '2px' }}>
                    COMMITTING BIOMETRIC DATA TO SOMNIA LEDGER.
                </p>
            </div>
        );
    }

    if (uiState === 'FIRE') {
        return (
            <div className="flex-center column pulse-tensed">
                <h1 className="title-display" style={{ fontSize: '6rem', color: 'var(--green)', marginBottom: '3rem' }}>FIRE</h1>
                <button
                    className="btn-precision"
                    style={{ width: '250px', height: '250px', borderRadius: '50%', fontSize: '2rem', borderColor: 'var(--green)', color: 'var(--green)' }}
                    onClick={handleReact}
                >
                    REACT
                </button>
            </div>
        );
    }

    return (
        <div className="flex-center column pulse-breathing">
            <div style={{
                width: '180px', height: '180px',
                borderRadius: '50%',
                border: '4px dotted var(--purple)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div className="sonar-ping">
                    <div className="sonar-ring" style={{ borderColor: 'var(--purple)' }} />
                </div>
                <p className="title-display" style={{ fontSize: '0.8rem', color: 'var(--purple)' }}>STANDBY</p>
            </div>
            <h2 className="title-display" style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'var(--purple)' }}>STABILIZING_NEURAL_LINK...</h2>
            <div style={{ marginTop: '4rem', opacity: 0.4 }}>
                <p style={{ fontSize: '0.6rem', color: 'var(--red)', letterSpacing: '3px' }}>[ PREMATURE REACTION DISQUALIFIES ]</p>
                <button
                    className="btn-precision"
                    style={{ borderColor: 'var(--red)', color: 'var(--red)', marginTop: '1.5rem', fontSize: '0.6rem' }}
                    onClick={() => { ensureAudio(); handleReact(); }}
                >
                    TEST_FALSE_START
                </button>
            </div>
        </div>
    );
}