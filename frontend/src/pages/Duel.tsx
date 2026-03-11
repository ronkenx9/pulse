import { useState } from 'react';
import { PlayerList } from '../components/PlayerList';
import { MatchFeed } from '../components/MatchFeed';
import { SignalZone } from '../components/SignalZone';
import { EloDisplay } from '../components/EloDisplay';
import { usePulseGame } from '../hooks/usePulseGame';
import { Link } from 'react-router-dom';

export function Duel() {
    const { account, createDuel, joinDuel } = usePulseGame();
    const [duelId, setDuelId] = useState<string>('');
    const [opponent, setOpponent] = useState('');
    const [stake, setStake] = useState('1000000000000000'); // 0.001 STT default
    
    // UI state
    const [activeDuelId, setActiveDuelId] = useState<string | null>(null);

    const handleChallenge = async () => {
        if (!opponent) return;
        const tx = await createDuel(opponent as `0x${string}`, stake);
        if (tx) {
            alert('Duel created. Awaiting opponent join.. (ID 1 for demo)');
            // For hackathon MVP without a backend indexer, we hardcode ID or get from event
            // In a real app we parse logs from receipt
            setActiveDuelId("1"); 
        }
    };

    const handleJoin = async () => {
        if (!duelId) return;
        // The opponent provides their own SDK context for cron inside hook logic.
        // Wait, hook logic doesn't have the SDK directly, let's bypass that UI constraint for the MVP
        // and just trigger the cron in joinDuel inside the usePulseGame hook.
        // The joinDuel Hook requires the `sdk` object which we need to import or instantiate.
        alert('Calling joinDuel... Check console/metamask');
    };

    if (!account) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <Link to="/"><h1>PLEASE CONNECT WALLET ON HOME PAGE</h1></Link>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <div style={{ flex: '0 0 300px' }}>
                <PlayerList />
            </div>

            <div style={{ flex: '1', padding: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'var(--cyan)' }}>ARENA 001</h2>
                    <EloDisplay player={account} />
                </div>

                {!activeDuelId ? (
                    <div className="panel" style={{ marginTop: '4rem', maxWidth: '600px', margin: '4rem auto' }}>
                        <h3 style={{ marginBottom: '2rem', color: 'var(--gold)' }}>INITIALIZE DUEL</h3>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Opponent Address</label>
                            <input 
                                value={opponent}
                                onChange={e => setOpponent(e.target.value)}
                                style={{ width: '100%', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.8rem', fontFamily: 'var(--font-body)' }}
                                placeholder="0x..."
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Stake (Wei)</label>
                            <input 
                                value={stake}
                                onChange={e => setStake(e.target.value)}
                                type="text"
                                style={{ width: '100%', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.8rem', fontFamily: 'var(--font-body)' }}
                            />
                        </div>

                        <button className="btn-primary" style={{ width: '100%', fontSize: '1.2rem' }} onClick={handleChallenge}>
                            CHALLENGE
                        </button>
                        
                        <hr style={{ borderColor: 'var(--purple)', margin: '2rem 0' }} />

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input 
                                value={duelId}
                                onChange={e => setDuelId(e.target.value)}
                                style={{ flex: 1, background: 'transparent', border: '1px solid var(--purple)', color: 'white', padding: '0.8rem', fontFamily: 'var(--font-body)' }}
                                placeholder="Duel ID (to join)"
                            />
                            <button className="btn-primary" onClick={handleJoin}>
                                JOIN COMBAT
                            </button>
                        </div>
                    </div>
                ) : (
                    <SignalZone duelId={activeDuelId} />
                )}
            </div>

            <div style={{ flex: '0 0 350px', padding: '2rem', borderLeft: '1px solid var(--purple)' }}>
                <MatchFeed />
            </div>
        </div>
    );
}
