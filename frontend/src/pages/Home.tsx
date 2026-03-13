import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';
import { ensureAudio, startAmbient } from '../lib/audio';

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });

export function Home() {
  const navigate = useNavigate();
  const [duelCount, setDuelCount] = useState<string | null>(null);

  useEffect(() => {
    publicClient.readContract({
      address: PULSE_GAME_ADDRESS as `0x${string}`,
      abi: pulseGameAbi,
      functionName: 'duelCount',
    }).then((c) => setDuelCount((c as bigint).toString())).catch(() => { });

    startAmbient('LANDING');
  }, []);

  const handleEnter = async () => {
    await ensureAudio();
    navigate('/lobby');
  };

  return (
    <div className="flex-center column" style={{ height: '100vh', position: 'relative', textAlign: 'center', padding: '2rem' }}>

      <div className="biometric-overlay pulse-breathing">
        <div className="stat-box">
          <span className="stat-label">SYSTEM STATUS</span>
          <span className="stat-value" style={{ color: 'var(--green)', fontSize: '1rem' }}>NOMINAL (SINUS)</span>
        </div>
        <div className="stat-box" style={{ marginTop: '1.5rem' }}>
          <span className="stat-label">GLOBAL DUELS</span>
          <span className="stat-value numeric">
            {duelCount !== null ? Number(duelCount).toLocaleString() : '---'}
          </span>
        </div>
      </div>

      <div className="pulse-breathing">
        <div style={{ marginBottom: '1rem' }}>
          <span className="stat-label" style={{ letterSpacing: '8px', opacity: 0.6 }}>SOMNIA TESTNET :: BIOMETRIC PROTOCOL</span>
        </div>

        <h1 className="title-display" style={{ fontSize: 'clamp(4rem, 12vw, 10rem)', lineHeight: '0.8', marginBottom: '1rem' }}>
          PULSE
        </h1>

        <p style={{ maxWidth: '600px', margin: '0 auto 4rem', fontSize: '0.9rem', letterSpacing: '3px', opacity: 0.8, lineHeight: '1.8' }}>
          REAL-TIME ON-CHAIN REFLEX DUELS.<br />
          POWERED BY SOMNIA REACTIVITY.<br />
          ZERO POLLING. MILLISECONDS DECIDE EVERYTHING.
        </p>

        <div style={{ position: 'relative', width: '300px', height: '120px', margin: '0 auto' }}>
          <div className="sonar-ping">
            <div className="sonar-ring" />
            <div className="sonar-ring" />
            <div className="sonar-ring" />
          </div>

          <button
            className="btn-precision"
            style={{ fontSize: '1.1rem', padding: '1.2rem 2.5rem', width: '300px', position: 'relative', zIndex: 5 }}
            onClick={handleEnter}
          >
            ENTER THE ARENA
          </button>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <p style={{ color: 'var(--red)', fontSize: '0.7rem', letterSpacing: '4px', fontWeight: 'bold' }}>
            [ WARNING: FALSE STARTS FORFEIT ENTIRE STAKE ]
          </p>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '120px', left: '0', width: '100%', opacity: 0.3 }}>
        <p className="stat-label" style={{ textAlign: 'center' }}>POWERED BY SOMNIA REACTIVITY ENGINE v2.0</p>
      </div>

    </div>
  );
}
