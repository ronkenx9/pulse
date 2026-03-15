import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';
import { ensureAudio, startBGM, playClick } from '../lib/audio';
import { OnboardingSlideshow } from '../components/OnboardingSlideshow';

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });

const ONBOARDING_KEY = 'pulse_onboarded';

export function Home() {
  const navigate = useNavigate();
  const [duelCount, setDuelCount] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_KEY));

  useEffect(() => {
    startBGM('LANDING');
    publicClient.readContract({
      address: PULSE_GAME_ADDRESS as `0x${string}`,
      abi: pulseGameAbi,
      functionName: 'duelCount',
    }).then((c) => setDuelCount((c as bigint).toString())).catch(() => {});
  }, []);

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  const handleEnter = async () => {
    await ensureAudio();
    playClick();
    startBGM('LOBBY');
    navigate('/lobby');
  };

  if (showOnboarding) {
    return <OnboardingSlideshow onComplete={handleOnboardingDone} onSkip={handleOnboardingDone} />;
  }

  return (
    <div className="flex-center column" style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Top Marquee */}
      <div style={{
        position: 'absolute', top: 0, width: '100%', background: 'var(--red)',
        color: '#fff', padding: '0.5rem 0', fontFamily: 'var(--font-display)',
        fontSize: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', zIndex: 10,
      }}>
        <div style={{ display: 'inline-block', animation: 'marquee 20s linear infinite', paddingLeft: '100%' }}>
          WARNING: HIGH VOLTAGE ON-CHAIN STAKES :: ALL VICTORIES FINAL :: NEURAL SYNC REQUIRED :: SOMNIA PROTOCOL v2.0 ::
          WARNING: HIGH VOLTAGE ON-CHAIN STAKES :: ALL VICTORIES FINAL :: NEURAL SYNC REQUIRED :: SOMNIA PROTOCOL v2.0 ::
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes staggered-neon {
          0%, 100% { opacity: 1; text-shadow: 3px 3px 0 var(--purple), -1px -1px 0 var(--green); }
          50% { opacity: 0.8; text-shadow: none; }
        }
      `}</style>

      {/* Main Content */}
      <div className="pixel-in" style={{ textAlign: 'center', zIndex: 5 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="stat-label" style={{ color: 'var(--gold)', letterSpacing: '8px' }}>SOMNIA_ARCADE_SYSTEM</span>
        </div>

        <h1 className="title-display" style={{ fontSize: '10rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          {'PULSE'.split('').map((char, i) => (
            <span key={i} style={{ animation: `staggered-neon 2s infinite ${i * 0.2}s` }}>{char}</span>
          ))}
        </h1>

        <div style={{ marginBottom: '6rem' }}>
          <p className="numeric" style={{ color: 'var(--magenta)', fontSize: '0.9rem', letterSpacing: '4px' }}>
            [ SOMNIA CHAIN &gt;&gt; SEASON 01 ]
          </p>
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <button
            className="btn-precision"
            style={{ fontSize: '1.2rem', padding: '1.5rem 3rem' }}
            onClick={handleEnter}
          >
            <span className="arcade-blink">INSERT COIN</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <div className="arcade-blink" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.6rem' }}>
            PRESS START TO PLAY
          </div>
          <button
            style={{
              background: 'none', border: '1px solid var(--cyan)', color: 'var(--cyan)',
              fontFamily: 'var(--font-display)', fontSize: '0.45rem', padding: '0.4rem 1rem',
              cursor: 'pointer', opacity: 0.6,
            }}
            onClick={() => setShowOnboarding(true)}
          >
            HOW TO PLAY
          </button>
        </div>
      </div>

      {/* Footer Bar */}
      <div style={{
        position: 'absolute', bottom: '2rem', width: '100%', padding: '0 4rem',
        display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)',
        fontSize: '0.6rem', color: 'var(--cyan)',
      }}>
        <div>TOTAL BATTLES: {duelCount || '0000'}</div>
        <div style={{ color: 'var(--gold)' }}>CREDIT: 01</div>
      </div>

      <div style={{ position: 'fixed', bottom: '120px', right: '40px', opacity: 0.1, pointerEvents: 'none' }}>
        <h1 className="title-display" style={{ fontSize: '12rem', letterSpacing: '0' }}>88</h1>
      </div>
    </div>
  );
}
