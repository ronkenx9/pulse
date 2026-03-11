import { useEffect, useState } from 'react';
import { usePulseGame } from '../hooks/usePulseGame';
import { useReactivity } from '../hooks/useReactivity';
import { playHum, playSnap, playBassDrop, audioCtx } from '../lib/audio';

export function SignalZone({ duelId }: { duelId: string }) {
    const { submitReaction } = usePulseGame();
    const { isArmed, gameResult, isFalseStart } = useReactivity(duelId);
    
    // Local UI State
    const [humNode, setHumNode] = useState<OscillatorNode | null>(null);

    // Initial hum when WAITING
    useEffect(() => {
        if (!isArmed && !gameResult && !isFalseStart) {
            const node = playHum();
            setHumNode(node);
        }
        return () => {
            if (humNode) humNode.stop();
        }
    }, [isArmed, gameResult, isFalseStart]);

    // Handle Fire
    useEffect(() => {
        if (isArmed && !gameResult) {
            if (humNode) {
                humNode.stop();
                setHumNode(null);
            }
            playSnap();
            document.body.classList.add('signal-fire');
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 400);
        }
    }, [isArmed, gameResult]);

    // Handle Resolved
    useEffect(() => {
        if (gameResult) {
            document.body.classList.remove('signal-fire');
            playBassDrop();
        }
    }, [gameResult]);

    const handleReact = () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        submitReaction(duelId);
    };

    if (gameResult) {
        return (
            <div className="panel" style={{ textAlign: 'center', borderColor: 'var(--gold)' }}>
                <h1 style={{ color: isFalseStart ? 'var(--red)' : 'var(--gold)', fontSize: '3rem' }}>
                    {isFalseStart ? "FALSE START" : "DUEL RESOLVED"}
                </h1>
                <div style={{ marginTop: '2rem' }}>
                    <p className="numeric" style={{ fontSize: '2rem' }}>WINNER</p>
                    <p style={{ color: 'var(--green)' }}>{gameResult.winner}</p>
                </div>
                {!isFalseStart && (
                    <div style={{ marginTop: '2rem' }}>
                        <p>CLIENT REACTION TIME</p>
                        <p className="numeric" style={{ fontSize: '3rem', color: 'var(--cyan)' }}>
                            {Math.round(gameResult.clientReactionMs)} ms
                        </p>
                    </div>
                )}
            </div>
        );
    }

    if (isArmed) {
        return (
            <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                <h1 style={{ fontSize: '4rem', color: 'black' }}>REACT!</h1>
                <button className="react-btn" onClick={handleReact}>
                    INITIATE
                </button>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', marginTop: '5vh' }}>
            <div style={{
                width: '150px', height: '150px', 
                borderRadius: '50%',
                border: '4px solid var(--purple)',
                margin: '0 auto',
                animation: 'radioactivePulse 2s infinite alternate',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <p>WAITING</p>
            </div>
            <h2 style={{ marginTop: '2rem', animation: 'numFlicker 2s infinite' }}>SYNCHRONIZING SECURE CRON...</h2>
            {/* Provide early reaction button to test false starts */}
            <div style={{ marginTop: '3rem' }}>
                <button 
                  className="btn-primary" 
                  style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                  onClick={handleReact}
                >
                  [DANGER: FALSE START TEST]
                </button>
            </div>
        </div>
    );
}
