import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPublicClient, http } from 'viem';
import { useWallet } from '../context/WalletContext';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';
import { OnboardingSlideshow } from '../components/OnboardingSlideshow';
import { ensureAudio } from '../lib/audio';

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });

const PARTICLES = [
  { id: 0, style: { top: '18%', left: '2%', '--pa': '38deg', '--pd': '0s', '--pdur': '3.2s' } },
  { id: 1, style: { top: '12%', left: '94%', '--pa': '-145deg', '--pd': '0.4s', '--pdur': '2.8s' } },
  { id: 2, style: { top: '82%', left: '5%', '--pa': '-28deg', '--pd': '0.8s', '--pdur': '3.5s' } },
  { id: 3, style: { top: '78%', left: '90%', '--pa': '152deg', '--pd': '0.2s', '--pdur': '3.0s' } },
  { id: 4, style: { top: '2%', left: '48%', '--pa': '92deg', '--pd': '1.0s', '--pdur': '2.5s' } },
  { id: 5, style: { top: '48%', left: '1%', '--pa': '2deg', '--pd': '0.6s', '--pdur': '3.8s' } },
  { id: 6, style: { top: '58%', left: '97%', '--pa': '-178deg', '--pd': '1.4s', '--pdur': '2.6s' } },
  { id: 7, style: { top: '97%', left: '28%', '--pa': '-82deg', '--pd': '0.3s', '--pdur': '3.3s' } },
];

export function Home() {
  const { account, connect } = useWallet();
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const [duelCount, setDuelCount] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [prevAccount, setPrevAccount] = useState<string | null>(null);

  useEffect(() => {
    publicClient.readContract({
      address: PULSE_GAME_ADDRESS as `0x${string}`,
      abi: pulseGameAbi,
      functionName: 'duelCount',
    }).then((c) => setDuelCount((c as bigint).toString())).catch(() => { });
  }, []);

  useEffect(() => {
    if (account && !prevAccount) {
      setJustConnected(true);
      setConnecting(false);
      setPrevAccount(account);
      const hasOnboarded = localStorage.getItem('pulse_onboarded');
      if (!hasOnboarded) {
        setTimeout(() => setShowOnboarding(true), 700);
      }
    }
  }, [account, prevAccount]);

  const handleConnect = async () => {
    ensureAudio();
    setConnecting(true);
    try {
      await connect();
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('pulse_onboarded', '1');
    navigate('/duel');
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem('pulse_onboarded', '1');
  };

  return (
    <div className="home-root">
      {/* Circuit grid background */}
      <svg className="circuit-grid" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        {[80, 160, 260, 380, 500, 620, 720, 820, 880].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="1440" y2={y}
            stroke="rgba(139,43,226,0.10)" strokeWidth="1" />
        ))}
        {[160, 320, 480, 640, 720, 800, 960, 1120, 1280].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="900"
            stroke="rgba(139,43,226,0.10)" strokeWidth="1" />
        ))}
        <line x1="0" y1="0" x2="350" y2="900" stroke="rgba(0,255,255,0.03)" strokeWidth="1.5" />
        <line x1="1440" y1="0" x2="1090" y2="900" stroke="rgba(0,255,255,0.03)" strokeWidth="1.5" />
        {/* Corner brackets */}
        <polyline points="0,0 60,0 60,40" stroke="rgba(0,255,255,0.25)" strokeWidth="1.5" fill="none" />
        <polyline points="1440,0 1380,0 1380,40" stroke="rgba(0,255,255,0.25)" strokeWidth="1.5" fill="none" />
        <polyline points="0,900 60,900 60,860" stroke="rgba(0,255,255,0.25)" strokeWidth="1.5" fill="none" />
        <polyline points="1440,900 1380,900 1380,860" stroke="rgba(0,255,255,0.25)" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Radial glow at center */}
      <div className="center-glow" />

      {/* Particle energy lines */}
      {PARTICLES.map(p => (
        <div key={p.id} className="particle-line" style={p.style as React.CSSProperties} />
      ))}

      {/* Main centered content */}
      <div className="home-center">

        <div className="home-title-block">
          <div className="home-title-eyebrow">SOMNIA TESTNET</div>
          <h1 className="home-title">PULSE</h1>
          <p className="home-subtitle">REAL-TIME ON-CHAIN REFLEX DUELS</p>
          <p className="home-subtext">
            Powered by Somnia Reactivity · Zero polling · Milliseconds decide everything
          </p>
        </div>

        {/* THE MAIN CHARACTER */}
        <div className={`hero-btn-wrap ${account ? 'hero-btn-wrap--connected' : ''} ${justConnected ? 'hero-btn-wrap--flash' : ''}`}>
          <div className="orbit-ring" />
          <div className="orbit-ring orbit-ring--2" />
          <div className="orbit-ring orbit-ring--3" />

          {!account ? (
            <button
              className={`connect-hero-btn ${connecting ? 'connect-hero-btn--loading' : ''}`}
              onClick={handleConnect}
              disabled={connecting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {connecting ? (
                <span className="connect-loading">
                  <span className="dot" /><span className="dot" style={{ animationDelay: '0.2s' }} /><span className="dot" style={{ animationDelay: '0.4s' }} />
                </span>
              ) : 'CONNECT WALLET'}
            </button>
          ) : (
            <div className="connected-ctas">
              <div className="connected-address">
                <span className="address-dot" />
                {account.slice(0, 6)}···{account.slice(-4)}
              </div>
              <div className="cta-row">
                <Link to="/duel">
                  <button className="cta-btn cta-btn--primary" onClick={() => ensureAudio()}>ENTER ARENA</button>
                </Link>
                <Link to="/practice">
                  <button className="cta-btn cta-btn--secondary" onClick={() => ensureAudio()}>PRACTICE</button>
                </Link>
              </div>
              <Link to="/leaderboard" className="leaderboard-link">
                VIEW LEADERBOARD →
              </Link>
            </div>
          )}
        </div>

        {!account && (
          <p className="hero-tagline">
            False starts forfeit the entire pot. React with precision.
          </p>
        )}
      </div>

      {/* Live stat pill */}
      <div className="home-stat">
        <span className="stat-label">DUELS FOUGHT</span>
        <span className="stat-value numeric">
          {duelCount !== null ? Number(duelCount).toLocaleString() : '···'}
        </span>
      </div>

      <div className="somnia-badge">
        POWERED BY <span>SOMNIA</span>
      </div>

      {showOnboarding && (
        <OnboardingSlideshow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
}
