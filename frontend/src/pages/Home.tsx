import { Link } from 'react-router-dom';
import { usePulseGame } from '../hooks/usePulseGame';

export function Home() {
    const { account, connect } = usePulseGame();

    return (
        <div style={{ padding: '4rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '5rem', color: 'var(--cyan)', textShadow: '0 0 20px var(--cyan)' }}>PULSE</h1>
            <h2 style={{ marginTop: '1rem', color: 'var(--green)' }}>REAL-TIME ON-CHAIN REFLEX DUELS</h2>
            
            <p style={{ marginTop: '2rem', fontSize: '1.2rem', lineHeight: '1.6' }}>
                Powered by Somnia Reactivity. Zero polling.<br/>
                First to react wins. False starts forfeit the entire pot.
            </p>

            <div style={{ marginTop: '4rem' }}>
                {!account ? (
                    <button className="react-btn" style={{ fontSize: '1.5rem', padding: '1rem 2rem' }} onClick={connect}>
                        CONNECT WALLET TO ENTER
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <Link to="/duel" style={{ textDecoration: 'none' }}>
                            <button className="react-btn" style={{ fontSize: '1.5rem', padding: '1rem 2rem' }}>
                                ENTER ARENA
                            </button>
                        </Link>
                        <Link to="/leaderboard" style={{ textDecoration: 'none' }}>
                            <button className="btn-primary" style={{ fontSize: '1.5rem', padding: '1rem 2rem' }}>
                                LEADERBOARD
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            <div className="panel" style={{ marginTop: '6rem' }}>
                <h3>GLOBAL STATS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                    <div>
                        <p>Total Duels</p>
                        <p className="numeric" style={{ fontSize: '2rem', color: 'var(--gold)' }}>14,203</p>
                    </div>
                    <div>
                        <p>Avg Reaction Time</p>
                        <p className="numeric" style={{ fontSize: '2rem', color: 'var(--gold)' }}>214ms</p>
                    </div>
                    <div>
                        <p>Total ELO Wagered</p>
                        <p className="numeric" style={{ fontSize: '2rem', color: 'var(--gold)' }}>8.4M</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
