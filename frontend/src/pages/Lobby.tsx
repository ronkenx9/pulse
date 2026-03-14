import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { startAmbient } from '../lib/audio';

export function Lobby() {
    const { account } = useWallet();
    const navigate = useNavigate();
    const [hoverMode, setHoverMode] = useState<string | null>(null);

    useEffect(() => {
        startAmbient('LOBBY');
    }, []);

    return (
        <div className="flex-center column pixel-in" style={{ minHeight: '100vh', padding: '4rem 2rem', position: 'relative' }}>

            {/* ── Coin Return ──────────────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
                <button
                    className="btn-precision"
                    style={{ fontSize: '0.6rem', padding: '0.6rem 1.2rem' }}
                    onClick={() => navigate('/')}
                >
                    COIN RETURN ←
                </button>
            </div>

            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <span className="stat-label" style={{ color: 'var(--gold)' }}>SELECT MODE</span>
                <h1 className="title-display" style={{ fontSize: '2.5rem', marginTop: '1rem' }}>CHOOSE ARENA</h1>
            </div>

            {!account ? (
                <div className="panel flex-center column" style={{ width: '450px', textAlign: 'center' }}>
                    <div className="panel-header-strip" style={{ background: 'var(--gold)' }} />
                    <h2 className="title-display" style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--gold)' }}>
                        INSERT COIN
                    </h2>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '2.5rem', lineHeight: '1.6', color: 'var(--cyan)' }}>
                        CREDIT[00] REQUIRED TO START.<br />
                        CONNECT NEURAL LINK TO ESTABLISH CREDIT.
                    </p>
                    <div className="arcade-blink">
                        <ConnectButton />
                    </div>
                </div>
            ) : (
                <div className="flex-center column" style={{ width: '100%', maxWidth: '1000px' }}>

                    {/* ── Credit Monitor ─────────────────────────────────────────────────── */}
                    <div className="stat-box" style={{ marginBottom: '3rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div>
                            <span className="stat-label">PILOT_ID</span>
                            <span className="numeric" style={{ color: 'var(--green)', marginLeft: '1rem' }}>
                                {account.slice(0, 6)}...{account.slice(-4)}
                            </span>
                        </div>
                        <div style={{ width: '2px', height: '20px', background: 'var(--purple)', opacity: 0.3 }} />
                        <div>
                            <span className="stat-label">CREDIT</span>
                            <span className="numeric" style={{ color: 'var(--gold)', marginLeft: '1rem' }}>01</span>
                        </div>
                    </div>

                    {/* ── Mode Selection ─────────────────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', width: '100%' }}>

                        {/* Arena Card */}
                        <Link
                            to="/duel"
                            style={{ textDecoration: 'none', display: 'block' }}
                            onMouseEnter={() => setHoverMode('arena')}
                            onMouseLeave={() => setHoverMode(null)}
                        >
                            <div className="panel flex-center column" style={{
                                textAlign: 'center',
                                cursor: 'pointer',
                                transform: hoverMode === 'arena' ? 'translateY(-10px)' : 'none',
                                boxShadow: hoverMode === 'arena' ? '0 0 40px var(--magenta)' : 'none',
                                border: hoverMode === 'arena' ? '4px solid var(--magenta)' : '4px solid var(--bg-deep)'
                            }}>
                                {hoverMode === 'arena' && (
                                    <div className="arcade-blink" style={{
                                        position: 'absolute',
                                        top: '-1.5rem',
                                        fontFamily: 'var(--font-display)',
                                        color: 'var(--magenta)',
                                        fontSize: '0.6rem'
                                    }}>
                                        P1 READY
                                    </div>
                                )}
                                <div className="panel-header-strip" style={{ background: 'var(--magenta)' }} />
                                <div style={{ color: 'var(--magenta)', marginBottom: '1.5rem' }}>
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>PULSE ARENA</h3>
                                <p style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--cyan)', lineHeight: '1.6', height: '3.2rem' }}>
                                    JOIN THE RANKED POOL.<br />FACE THE WORLD IN REAL-TIME.
                                </p>
                                <div style={{
                                    marginTop: '1rem',
                                    border: '2px solid var(--magenta)',
                                    padding: '0.5rem',
                                    color: 'var(--magenta)',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '0.5rem'
                                }}>
                                    VS HUMAN
                                </div>
                            </div>
                        </Link>

                        {/* Practice Card */}
                        <Link
                            to="/practice"
                            style={{ textDecoration: 'none', display: 'block' }}
                            onMouseEnter={() => setHoverMode('training')}
                            onMouseLeave={() => setHoverMode(null)}
                        >
                            <div className="panel flex-center column" style={{
                                textAlign: 'center',
                                cursor: 'pointer',
                                transform: hoverMode === 'training' ? 'translateY(-10px)' : 'none',
                                boxShadow: hoverMode === 'training' ? '0 0 40px var(--green)' : 'none',
                                border: hoverMode === 'training' ? '4px solid var(--green)' : '4px solid var(--bg-deep)'
                            }}>
                                {hoverMode === 'training' && (
                                    <div className="arcade-blink" style={{
                                        position: 'absolute',
                                        top: '-1.5rem',
                                        fontFamily: 'var(--font-display)',
                                        color: 'var(--green)',
                                        fontSize: '0.6rem'
                                    }}>
                                        P1 READY
                                    </div>
                                )}
                                <div className="panel-header-strip" style={{ background: 'var(--green)' }} />
                                <div style={{ color: 'var(--green)', marginBottom: '1.5rem' }}>
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </div>
                                <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--green)' }}>TRAINING</h3>
                                <p style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--cyan)', lineHeight: '1.6', height: '3.2rem' }}>
                                    CALIBRATE REFLEXES.<br />ZERO STAKE :: AI CHALLENGE.
                                </p>
                                <div style={{
                                    marginTop: '1rem',
                                    border: '2px solid var(--green)',
                                    padding: '0.5rem',
                                    color: 'var(--green)',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '0.5rem'
                                }}>
                                    VS AI
                                </div>
                            </div>
                        </Link>

                    </div>

                    {/* ── High Scores Link ──────────────────────────────────────────────── */}
                    <Link to="/leaderboard" style={{ marginTop: '5rem', textDecoration: 'none' }}>
                        <div className="btn-precision" style={{
                            borderColor: 'var(--gold)',
                            color: 'var(--gold)',
                            padding: '1rem 3rem',
                            boxShadow: '4px 0 0 0 var(--gold), -4px 0 0 0 var(--gold), 0 4px 0 0 var(--gold), 0 -4px 0 0 var(--gold), 0 8px 0 0 var(--bg-deep)'
                        }}>
                             HIGH SCORES >>
                        </div>
                    </Link>

                </div>
            )}

            {/* Decor */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '4rem', opacity: 0.1, pointerEvents: 'none' }}>
                <h1 className="title-display" style={{ fontSize: '8rem' }}>01</h1>
            </div>

        </div>
    );
}
