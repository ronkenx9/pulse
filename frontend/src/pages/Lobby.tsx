import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect } from 'react';
import { startAmbient } from '../lib/audio';

export function Lobby() {
    const { account } = useWallet();
    const navigate = useNavigate();

    useEffect(() => {
        startAmbient('LOBBY');
    }, []);

    return (
        <div className="flex-center column" style={{ minHeight: '100vh', padding: '4rem 2rem' }}>

            <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
                <button className="btn-precision" style={{ fontSize: '0.6rem', padding: '0.4rem 1rem' }} onClick={() => navigate('/')}>
                    ← DISCONNECT_LINK
                </button>
            </div>

            <div className="pulse-breathing" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <span className="stat-label" style={{ letterSpacing: '5px' }}>LOBBY_STATION_01</span>
                <h1 className="title-display" style={{ fontSize: '3rem', marginTop: '0.5rem' }}>MATCHMAKING</h1>
            </div>

            {!account ? (
                <div className="panel flex-center column" style={{ width: '400px', textAlign: 'center' }}>
                    <h2 className="title-display" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--gold)' }}>
                        AUTHENTICATION REQUIRED
                    </h2>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '2rem' }}>
                        Establish a biometric link through your Web3 wallet to enter the neural arena.
                    </p>
                    <ConnectButton />
                </div>
            ) : (
                <div className="flex-center column" style={{ width: '100%', maxWidth: '900px' }}>

                    <div className="stat-box" style={{ marginBottom: '3rem', textAlign: 'center', borderLeft: 'none' }}>
                        <span className="stat-label">LINK ESTABLISHED</span>
                        <span className="stat-value numeric" style={{ fontSize: '1.2rem', color: 'var(--green)' }}>
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%' }}>

                        <div className="panel flex-center column" style={{ textAlign: 'center' }}>
                            <div className="pulse-breathing" style={{ color: 'var(--cyan)', marginBottom: '1.5rem' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem' }}>PULSE ARENA</h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '2rem', height: '3rem' }}>
                                Join the high-stakes reflex pool. Face human opponents in real-time.
                            </p>
                            <Link to="/duel" style={{ width: '100%' }}>
                                <button className="btn-precision" style={{ width: '100%' }}>INITIATE DUEL</button>
                            </Link>
                        </div>

                        <div className="panel flex-center column" style={{ textAlign: 'center', borderColor: 'var(--purple)' }}>
                            <div className="pulse-breathing" style={{ color: 'var(--purple)', marginBottom: '1.5rem' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                            </div>
                            <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--purple)' }}>NEURAL TRAINING</h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '2rem', height: '3rem' }}>
                                Calibrate your reflexes against the biometric AI. Zero stake.
                            </p>
                            <Link to="/practice" style={{ width: '100%' }}>
                                <button className="btn-precision" style={{ width: '100%', borderColor: 'var(--purple)', color: 'var(--purple)' }}>BEGIN TRAINING</button>
                            </Link>
                        </div>

                    </div>

                    <Link to="/leaderboard" style={{ marginTop: '4rem', textDecoration: 'none' }}>
                        <span className="stat-label" style={{ color: 'var(--gold)', borderBottom: '1px solid var(--gold)', paddingBottom: '2px' }}>
                            VIEW GLOBAL RANKINGS →
                        </span>
                    </Link>

                </div>
            )}

            <div style={{ position: 'fixed', bottom: '120px', right: '40px', opacity: 0.1, pointerEvents: 'none' }}>
                <h1 className="title-display" style={{ fontSize: '8rem' }}>01</h1>
            </div>

        </div>
    );
}
