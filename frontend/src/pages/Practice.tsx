import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { playSnap, playHum, playBassDrop, ensureAudio } from '../lib/audio';

type Difficulty = 'ROOKIE' | 'SOLDIER' | 'LEGEND';
type Stage = 'IDLE' | 'COUNTDOWN' | 'WAIT' | 'FIRE' | 'RESULT_HIT' | 'RESULT_EARLY';

const DIFFICULTIES: Record<Difficulty, { label: string; minMs: number; maxMs: number; target: number; range: string }> = {
  ROOKIE: { label: 'ROOKIE', minMs: 3000, maxMs: 5000, target: 500, range: '3 – 5s' },
  SOLDIER: { label: 'SOLDIER', minMs: 1500, maxMs: 3000, target: 300, range: '1.5 – 3s' },
  LEGEND: { label: 'LEGEND', minMs: 800, maxMs: 1800, target: 180, range: '0.8 – 1.8s' },
};

function grade(ms: number, target: number): { label: string; color: string } {
  if (ms < target * 0.6) return { label: 'LEGENDARY REFLEX', color: 'var(--gold)' };
  if (ms < target) return { label: 'SHARP — WELL DONE', color: 'var(--green)' };
  if (ms < target * 1.4) return { label: 'DECENT — KEEP TRAINING', color: 'var(--cyan)' };
  return { label: 'TOO SLOW — PRACTICE MORE', color: 'var(--red)' };
}

const HISTORY_KEY = 'pulse_practice_history';
const BEST_KEY = 'pulse_practice_best';

function loadHistory(): number[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(h: number[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-10)));
}

const BOT_ADDRESS = '0x4EE45DA3868ba337AAD8B2803f325a2900EDb2a5';

export function Practice() {
  const { account } = useWallet();
  const [mode, setMode] = useState<'OFFLINE' | 'ON-CHAIN'>('OFFLINE');
  const [difficulty, setDifficulty] = useState<Difficulty>('SOLDIER');
  const [stage, setStage] = useState<Stage>('IDLE');
  const [countdown, setCountdown] = useState(3);
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>(loadHistory);
  const [personalBest, setPersonalBest] = useState<number | null>(() => {
    const v = localStorage.getItem(BEST_KEY);
    return v ? Number(v) : null;
  });

  const startTimeRef = useRef<number>(0);
  const signalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const humHandleRef = useRef<{ stop: () => void } | null>(null);
  const [showScanline, setShowScanline] = useState(false);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (signalTimer.current) clearTimeout(signalTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  const startOnChain = async () => {
    if (!account) return alert("Connect wallet first");
    // This will redirect to the real Arena with the bot's address
    const stake = prompt("Stake in STMET?", "0.01");
    if (!stake) return;
    window.location.href = `/duel?opponent=${BOT_ADDRESS}&stake=${stake}`;
  };

  const startRound = () => {
    ensureAudio();
    if (signalTimer.current) clearTimeout(signalTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    setReactionMs(null);
    setStage('COUNTDOWN');
    setCountdown(3);

    let c = 3;
    countdownTimer.current = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownTimer.current!);
        beginWait();
      }
    }, 1000);
  };

  const beginWait = () => {
    setStage('WAIT');
    const { minMs, maxMs } = DIFFICULTIES[difficulty];
    const delay = minMs + Math.random() * (maxMs - minMs);
    humHandleRef.current = playHum();
    signalTimer.current = setTimeout(() => {
      if (humHandleRef.current) humHandleRef.current.stop();
      setStage('FIRE');
      startTimeRef.current = performance.now();
      playSnap();

      setShowScanline(true);
      setTimeout(() => setShowScanline(false), 500);

      document.body.classList.add('signal-active');
      document.body.classList.add('shake');
      setTimeout(() => {
        document.body.classList.remove('signal-active');
        document.body.classList.remove('shake');
      }, 500);
    }, delay);
  };

  const handleReact = () => {
    if (stage === 'WAIT') {
      // False start
      if (signalTimer.current) clearTimeout(signalTimer.current);
      playBassDrop();
      setStage('RESULT_EARLY');
      return;
    }
    if (stage === 'FIRE') {
      const ms = Math.round(performance.now() - startTimeRef.current);
      setReactionMs(ms);
      setStage('RESULT_HIT');
      playBassDrop();

      const newHistory = [...history, ms].slice(-10);
      setHistory(newHistory);
      saveHistory(newHistory);

      if (personalBest === null || ms < personalBest) {
        setPersonalBest(ms);
        localStorage.setItem(BEST_KEY, ms.toString());
      }
    }
  };

  const reset = () => {
    setStage('IDLE');
    setReactionMs(null);
  };

  const avg = history.length > 0 ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : null;

  return (
    <div className="practice-root">
      {/* Nav */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Link to="/"><button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>← HOME</button></Link>
        {account && (
          <Link to="/duel"><button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>ENTER ARENA</button></Link>
        )}
      </div>

      <h1 style={{ color: 'var(--cyan)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '6px' }}>
        PRACTICE MODE
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', letterSpacing: '2px', color: 'rgba(200,200,232,0.45)' }}>
        {mode === 'OFFLINE' ? 'TRAIN YOUR REFLEXES · NO STAKE · NO BLOCKCHAIN' : 'ON-CHAIN ARENA · CHALLENGE THE BOT · STAKE STMET'}
      </p>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          className={`btn-primary ${mode === 'OFFLINE' ? '' : 'btn-dim'}`}
          onClick={() => setMode('OFFLINE')}
          style={{ fontSize: '0.7rem', padding: '0.4rem 1rem' }}
        >
          OFFLINE (LOCAL)
        </button>
        <button
          className={`btn-primary ${mode === 'ON-CHAIN' ? '' : 'btn-dim'}`}
          onClick={() => setMode('ON-CHAIN')}
          style={{ fontSize: '0.7rem', padding: '0.4rem 1rem', borderColor: 'var(--gold)', color: mode === 'ON-CHAIN' ? 'var(--gold)' : '' }}
        >
          ON-CHAIN (BOT)
        </button>
      </div>

      {/* Difficulty selector (Only if offline) */}
      {mode === 'OFFLINE' && (
        <div className="difficulty-cards">
          {(Object.entries(DIFFICULTIES) as [Difficulty, typeof DIFFICULTIES[Difficulty]][]).map(([key, d]) => (
            <button
              key={key}
              className={`difficulty-card ${difficulty === key ? 'difficulty-card--active' : ''}`}
              onClick={() => { setDifficulty(key); reset(); }}
            >
              <span className="difficulty-name">{d.label}</span>
              <span className="difficulty-range">Signal: {d.range}</span>
              <span className="difficulty-target">Target: &lt;{d.target}ms</span>
            </button>
          ))}
        </div>
      )}

      {/* Arena */}
      <div className="practice-arena">

        {stage === 'IDLE' && mode === 'OFFLINE' && (
          <>
            <p className="practice-status">READY TO TRAIN</p>
            <button
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '1rem 3rem', letterSpacing: '4px' }}
              onClick={startRound}
            >
              START ROUND
            </button>
          </>
        )}

        {stage === 'IDLE' && mode === 'ON-CHAIN' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <p className="practice-status" style={{ color: 'var(--gold)' }}>ON-CHAIN CHALLENGE</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.6, maxWidth: '300px', margin: '0.5rem auto' }}>
                Create a real duelo on Somnia against our automated Bot.
                Winner takes the collective stake.
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '1rem 3rem', letterSpacing: '4px', borderColor: 'var(--gold)', color: 'var(--gold)' }}
              onClick={startOnChain}
            >
              CHALLENGE BOT
            </button>
          </>
        )}

        {stage === 'COUNTDOWN' && (
          <p className="practice-status" style={{ fontSize: '5rem', color: 'var(--cyan)', fontFamily: 'var(--font-numeric)' }}>
            {countdown > 0 ? countdown : 'GO'}
          </p>
        )}

        {stage === 'WAIT' && (
          <>
            <p className="practice-status practice-status--wait">WAIT FOR THE SIGNAL...</p>
            <button
              className="practice-react-btn"
              onClick={handleReact}
              style={{ opacity: 0.4, cursor: 'pointer' }}
            >
              REACT
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'rgba(200,200,232,0.3)', letterSpacing: '2px' }}>
              DON'T REACT YET
            </p>
          </>
        )}

        {stage === 'FIRE' && (
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {showScanline && <div className="scanline-sweep" />}
            <p className="practice-status practice-status--fire">FIRE!</p>
            <button className="practice-react-btn" onClick={handleReact}>
              REACT
            </button>
          </div>
        )}

        {stage === 'RESULT_HIT' && reactionMs !== null && (
          <div className="reaction-result">
            <span className="reaction-ms">{reactionMs}ms</span>
            <p className="reaction-grade" style={{ color: grade(reactionMs, DIFFICULTIES[difficulty].target).color }}>
              {grade(reactionMs, DIFFICULTIES[difficulty].target).label}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(200,200,232,0.4)', marginTop: '0.5rem' }}>
              TARGET: &lt;{DIFFICULTIES[difficulty].target}ms
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: '1.5rem', fontSize: '0.9rem', padding: '0.8rem 2rem' }}
              onClick={startRound}
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {stage === 'RESULT_EARLY' && (
          <div className="reaction-result">
            <p style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', color: 'var(--red)', letterSpacing: '2px' }}>
              FALSE START
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'rgba(200,200,232,0.6)', marginTop: '0.5rem' }}>
              You reacted before the signal fired.<br />
              In a real duel, your opponent wins the entire pot.
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: '1.5rem', fontSize: '0.9rem', padding: '0.8rem 2rem', borderColor: 'var(--red)', color: 'var(--red)' }}
              onClick={startRound}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      {history.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '3rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(200,200,232,0.4)', letterSpacing: '2px', marginBottom: '0.25rem' }}>BEST</div>
              <div style={{ fontFamily: 'var(--font-numeric)', fontSize: '2rem', color: 'var(--gold)' }}>
                {personalBest}ms
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(200,200,232,0.4)', letterSpacing: '2px', marginBottom: '0.25rem' }}>AVG (LAST {history.length})</div>
              <div style={{ fontFamily: 'var(--font-numeric)', fontSize: '2rem', color: 'var(--cyan)' }}>
                {avg}ms
              </div>
            </div>
          </div>

          {/* History chips */}
          <div className="practice-history">
            {history.map((ms, i) => (
              <div
                key={i}
                className={`history-chip ${ms === personalBest ? 'history-chip--best' : ''}`}
              >
                {ms}
              </div>
            ))}
          </div>

          <button
            onClick={() => { setHistory([]); setPersonalBest(null); localStorage.removeItem(HISTORY_KEY); localStorage.removeItem(BEST_KEY); }}
            style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '2px', color: 'rgba(200,200,232,0.25)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            CLEAR HISTORY
          </button>
        </div>
      )}

      {/* Arena CTA */}
      {account && stage !== 'WAIT' && stage !== 'FIRE' && stage !== 'COUNTDOWN' && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(200,200,232,0.3)', letterSpacing: '2px' }}>
          Ready for the real thing?{' '}
          <Link to="/duel" style={{ color: 'var(--green)', textDecoration: 'none' }}>
            ENTER ARENA →
          </Link>
        </p>
      )}
    </div>
  );
}
