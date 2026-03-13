import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { playSnap, playHum, playBassDrop, ensureAudio, startAmbient } from '../lib/audio';

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
const BOT_ADDRESS = '0x4EE45DA3868ba337AAD8B2803f325a2900EDb2a5';

export function Practice() {
  const { account } = useWallet();
  const [mode, setMode] = useState<'OFFLINE' | 'ON-CHAIN'>('OFFLINE');
  const [difficulty, setDifficulty] = useState<Difficulty>('SOLDIER');
  const [stage, setStage] = useState<Stage>('IDLE');
  const [countdown, setCountdown] = useState(3);
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [personalBest, setPersonalBest] = useState<number | null>(() => {
    const v = localStorage.getItem(BEST_KEY);
    return v ? Number(v) : null;
  });

  const startTimeRef = useRef<number>(0);
  const signalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const humHandleRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    startAmbient('ARENA');
    return () => {
      if (signalTimer.current) clearTimeout(signalTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (humHandleRef.current) humHandleRef.current.stop();
    };
  }, []);

  const startOnChain = async () => {
    if (!account) return alert("Connect wallet first");
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
    }, delay);
  };

  const handleReact = () => {
    if (stage === 'WAIT') {
      if (signalTimer.current) clearTimeout(signalTimer.current);
      if (humHandleRef.current) humHandleRef.current.stop();
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
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

      if (personalBest === null || ms < personalBest) {
        setPersonalBest(ms);
        localStorage.setItem(BEST_KEY, ms.toString());
      }
    }
  };

  const avg = history.length > 0 ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : null;

  return (
    <div className="flex-center column" style={{ minHeight: '100vh', padding: '4rem 2rem' }}>

      <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
        <Link to="/lobby">
          <button className="btn-precision" style={{ fontSize: '0.6rem' }}>← LOBBY</button>
        </Link>
      </div>

      <div className="pulse-breathing" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="stat-label">TRAINING_FACILITY_01</span>
        <h1 className="title-display" style={{ fontSize: '3rem' }}>NEURAL PRACTICE</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        <button
          className="btn-precision"
          style={{ opacity: mode === 'OFFLINE' ? 1 : 0.3, fontSize: '0.7rem' }}
          onClick={() => setMode('OFFLINE')}
        >
          LOCAL_SIMULATION
        </button>
        <button
          className="btn-precision"
          style={{ opacity: mode === 'ON-CHAIN' ? 1 : 0.3, borderColor: 'var(--gold)', color: 'var(--gold)', fontSize: '0.7rem' }}
          onClick={() => setMode('ON-CHAIN')}
        >
          BOT_CHALLENGE_EXT
        </button>
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '800px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>

        <div className="flex-center column" style={{ borderRight: '1px solid var(--border-dim)', paddingRight: '3rem', minHeight: '400px' }}>

          {stage === 'IDLE' && (
            <div className="flex-center column">
              <h2 className="title-display" style={{ fontSize: '1rem', marginBottom: '2rem', color: 'var(--green)' }}>SYSTEM_READY</h2>
              <button className="btn-precision pulse-breathing" style={{ padding: '1.5rem 3rem' }} onClick={mode === 'OFFLINE' ? startRound : startOnChain}>
                {mode === 'OFFLINE' ? 'START ROUND' : 'CHALLENGE BOT'}
              </button>
            </div>
          )}

          {stage === 'COUNTDOWN' && (
            <div className="flex-center column">
              <span className="stat-label">INIT_SEQ</span>
              <span className="numeric pulse-breathing" style={{ fontSize: '6rem', color: 'var(--cyan)' }}>{countdown > 0 ? countdown : 'GO'}</span>
            </div>
          )}

          {(stage === 'WAIT' || stage === 'FIRE') && (
            <div className={`flex-center column ${stage === 'FIRE' ? 'pulse-tensed' : 'pulse-breathing'}`} style={{ position: 'relative', width: '100%' }}>
              <h2 className="title-display" style={{ fontSize: '1.2rem', marginBottom: '3rem', color: stage === 'FIRE' ? 'var(--green)' : 'var(--red)' }}>
                {stage === 'WAIT' ? 'ANALYZING...' : 'FIRE!'}
              </h2>
              <button
                className="btn-precision"
                style={{ width: '200px', height: '200px', borderRadius: '50%', fontSize: '1.5rem', borderColor: stage === 'FIRE' ? 'var(--green)' : 'var(--red)', color: stage === 'FIRE' ? 'var(--green)' : 'var(--red)' }}
                onClick={handleReact}
              >
                REACT
              </button>
            </div>
          )}

          {(stage === 'RESULT_HIT' || stage === 'RESULT_EARLY') && (
            <div className="flex-center column">
              {stage === 'RESULT_HIT' ? (
                <>
                  <span className="numeric" style={{ fontSize: '5rem', color: 'var(--cyan)', lineHeight: '1' }}>{reactionMs}ms</span>
                  <p className="title-display" style={{ fontSize: '0.8rem', marginTop: '1rem', color: grade(reactionMs!, DIFFICULTIES[difficulty].target).color }}>
                    {grade(reactionMs!, DIFFICULTIES[difficulty].target).label}
                  </p>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <h2 className="title-display" style={{ fontSize: '2rem', color: 'var(--red)' }}>FALSE START</h2>
                  <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '1rem', letterSpacing: '2px' }}>NEURAL_SYNC_LOST</p>
                </div>
              )}
              <button className="btn-precision" style={{ marginTop: '3rem' }} onClick={startRound}>REPEAT_TEST</button>
            </div>
          )}

        </div>

        <div className="flex-center column" style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>

          <h3 className="title-display" style={{ fontSize: '0.7rem', marginBottom: '1.5rem' }}>CALIBRATION</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginBottom: '3rem' }}>
            {(Object.entries(DIFFICULTIES) as [Difficulty, typeof DIFFICULTIES[Difficulty]][]).map(([key, d]) => (
              <button
                key={key}
                className="btn-precision"
                style={{ fontSize: '0.6rem', padding: '0.6rem', textAlign: 'left', opacity: difficulty === key ? 1 : 0.3, borderColor: difficulty === key ? 'var(--cyan)' : 'var(--border-dim)' }}
                onClick={() => { setDifficulty(key); setStage('IDLE'); }}
              >
                {d.label} // TARGET: &lt;{d.target}MS
              </button>
            ))}
          </div>

          <h3 className="title-display" style={{ fontSize: '0.7rem', marginBottom: '1.5rem' }}>BIOMETRIC_DATA</h3>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="stat-box">
              <span className="stat-label">PERSONAL_BEST</span>
              <span className="stat-value numeric">{personalBest || '---'}ms</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">AVERAGE_REFLEX</span>
              <span className="stat-value numeric">{avg || '---'}ms</span>
            </div>
          </div>

          <div style={{ marginTop: '2rem', width: '100%' }}>
            <span className="stat-label">RECENT_RECORDS</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {history.map((ms, i) => (
                <div key={i} className="numeric" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', color: ms === personalBest ? 'var(--gold)' : 'var(--cyan)' }}>
                  {ms}ms
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
