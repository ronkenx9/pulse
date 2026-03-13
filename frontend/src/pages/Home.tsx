import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';
import { ensureAudio, startAmbient, playHeartbeatTick } from '../lib/audio';

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });

const ECG_PATH = 'M0,30 L18,30 Q21,26 24,30 L28,30 L30,32 L33,4 L36,56 L39,30 L52,30 Q57,22 62,30 L100,30';

export function Home() {
  const navigate = useNavigate();
  const [duelCount, setDuelCount] = useState<string | null>(null);
  const [beat, setBeat] = useState(false);
  const [entered, setEntered] = useState(false);
  const beatRef = useRef(false);

  useEffect(() => {
    publicClient
      .readContract({ address: PULSE_GAME_ADDRESS as `0x${string}`, abi: pulseGameAbi, functionName: 'duelCount' })
      .then((c) => setDuelCount((c as bigint).toString()))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const CYCLE = Math.round((60 / 68) * 1000);
    const id = setInterval(() => {
      if (beatRef.current) return;
      setBeat(true);
      beatRef.current = true;
      playHeartbeatTick();
      setTimeout(() => { setBeat(false); beatRef.current = false; }, 150);
    }, CYCLE);
    return () => clearInterval(id);
  }, []);

  const handleEnter = async () => {
    await ensureAudio();
    startAmbient();
    setEntered(true);
    setTimeout(() => navigate('/duel'), 680);
  };

  return (
    <div className="home-root">
      <svg className="ecg-grid-bg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sg" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30 0L0 0 0 30" fill="none" stroke="rgba(0,255,136,0.035)" strokeWidth="0.5" />
          </pattern>
          <pattern id="lg" width="150" height="150" patternUnits="userSpaceOnUse">
            <rect width="150" height="150" fill="url(#sg)" />
            <path d="M150 0L0 0 0 150" fill="none" stroke="rgba(0,255,136,0.07)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lg)" />
      </svg>

      <div className="ecg-trace-wrap">
        <svg className="ecg-trace" viewBox="0 0 400 60" preserveAspectRatio="none">
          <defs>
            <pattern id="ecgPat" x="0" y="0" width="100" height="60" patternUnits="userSpaceOnUse">
              <path d={ECG_PATH} stroke="rgba(0,255,136,0.5)" strokeWidth="1.5" fill="none" />
            </pattern>
          </defs>
          <rect width="400" height="60" fill="url(#ecgPat)" className="ecg-scroll" />
        </svg>
      </div>

      <div className={`ecg-glow-pulse${beat ? ' ecg-glow-pulse--beat' : ''}`} />

      <svg className="corner-brackets" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <polyline points="0,0 48,0 48,32" stroke="rgba(0,255,136,0.28)" strokeWidth="1.5" fill="none" />
        <polyline points="1440,0 1392,0 1392,32" stroke="rgba(0,255,136,0.28)" strokeWidth="1.5" fill="none" />
        <polyline points="0,900 48,900 48,868" stroke="rgba(0,255,136,0.28)" strokeWidth="1.5" fill="none" />
        <polyline points="1440,900 1392,900 1392,868" stroke="rgba(0,255,136,0.28)" strokeWidth="1.5" fill="none" />
      </svg>

      <div className={`home-center${beat ? ' home-center--beat' : ''}${entered ? ' home-center--exit' : ''}`}>
        <div className="home-title-block">
          <div className="home-title-eyebrow">SOMNIA TESTNET · CHAIN 50312</div>
          <h1 className="home-title">PULSE</h1>
          <p className="home-subtitle">REAL-TIME ON-CHAIN REFLEX DUELS</p>
          <p className="home-subtext">Zero polling · Somnia Reactivity · Milliseconds decide everything</p>
        </div>

        <div className="arena-btn-wrap">
          <div className="sonar-ring sonar-ring--1" />
          <div className="sonar-ring sonar-ring--2" />
          <div className="sonar-ring sonar-ring--3" />
          <button
            className={`enter-arena-btn${entered ? ' enter-arena-btn--entering' : ''}`}
            onClick={handleEnter}
            disabled={entered}
          >
            {entered ? (
              <span className="entering-text">INITIALISING...</span>
            ) : (
              <>
                <span className="enter-line-1">ENTER</span>
                <span className="enter-line-2">THE ARENA</span>
              </>
            )}
          </button>
        </div>

        <p className="hero-tagline">False starts forfeit the entire pot. React with precision.</p>
      </div>

      <div className="home-stat">
        <span className="stat-label">DUELS FOUGHT</span>
        <span className="stat-value numeric">{duelCount !== null ? Number(duelCount).toLocaleString() : '· · ·'}</span>
      </div>

      <div className="somnia-badge">POWERED BY <span>SOMNIA</span></div>

      <div className={`bpm-indicator${beat ? ' bpm-indicator--beat' : ''}`}>
        <span className="bpm-dot" />
        <span className="bpm-label">68 BPM</span>
      </div>
    </div>
  );
}
