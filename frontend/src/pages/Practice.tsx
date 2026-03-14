import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { playSnap, playHum, playBassDrop, ensureAudio, startAmbient } from '../lib/audio';

type Difficulty = 'ROOKIE' | 'SOLDIER' | 'LEGEND';
type Stage = 'IDLE' | 'COUNTDOWN' | 'WAIT' | 'FIRE' | 'RESULT_HIT' | 'RESULT_EARLY';

const DIFFICULTIES: Record<Difficulty, { label: string; minMs: number; maxMs: number; target: number; stage: string; color: string }> = {
  ROOKIE: { label: 'ROOKIE', minMs: 3000, maxMs: 5000, target: 500, stage: 'STAGE 1', color: 'var(--green)' },
  SOLDIER: { label: 'SOLDIER', minMs: 1500, maxMs: 3000, target: 300, stage: 'STAGE 2', color: 'var(--gold)' },
  LEGEND: { label: 'LEGEND', minMs: 800, maxMs: 1800, target: 180, stage: 'STAGE 3', color: 'var(--magenta)' },
};

function getGrade(ms: number, target: number): { label: string; color: string } {
  if (ms < target * 0.6) return { label: 'S RANK', color: 'var(--gold)' };
  if (ms < target) return { label: 'A RANK', color: 'var(--green)' };
  if (ms < target * 1.4) return { label: 'B RANK', color: 'var(--cyan)' };
  return { label: 'FAIL', color: 'var(--red)' };
}

const HISTORY_KEY = 'pulse_practice_history';
const BEST_KEY = 'pulse_practice_best';
const BOT_ADDRESS = '0x4EE45DA3868ba337AAD8B2803f325a2900EDb2a5';

export function Practice() {
  const navigate = useNavigate();
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

  return (
    <div className="flex-center column pixel-in" style={{ minHeight: '100vh', padding: '4rem 2rem' }}>

      <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
        <Link to="/lobby">
          <button className="btn-precision" style={{ fontSize: '0.6rem' }}>← DISCONNECT</button>
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="stat-label" style={{ color: 'var(--purple)' }}>SELECT STAGE</span>
        <h1 className="title-display" style={{ fontSize: '2.5rem', marginTop: '1rem' }}>TRAINING MODE</h1>
      </div>

      {/* ── Mode Select ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
        <button
          className="btn-precision"
          style={{ opacity: mode === 'OFFLINE' ? 1 : 0.3, fontSize: '0.6rem', padding: '0.8rem 1.5rem' }}
          onClick={() => setMode('OFFLINE')}
        >
          [ LOCAL SIM ]
        </button>
        <button
          className="btn-precision"
          style={{
            opacity: mode === 'ON-CHAIN' ? 1 : 0.3,
            borderColor: 'var(--gold)',
            color: 'var(--gold)',
            fontSize: '0.6rem',
            padding: '0.8rem 1.5rem',
            boxShadow: '4px 0 0 0 var(--gold), -4px 0 0 0 var(--gold), 0 4px 0 0 var(--gold), 0 -4px 0 0 var(--gold), 0 8px 0 0 var(--bg-deep)'
          }}
          onClick={() => setMode('ON-CHAIN')}
        >
          [ AI DUEL ]
        </button>
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0', padding: 0 }}>
        <div className="panel-header-strip" style={{ background: DIFFICULTIES[difficulty].color }} />

        {/* Left: Action Area */}
        <div className="flex-center column" style={{ borderRight: '4px solid var(--bg-deep)', padding: '3rem', minHeight: '450px', background: 'rgba(0,0,0,0.2)' }}>

          {stage === 'IDLE' && (
            <div className="flex-center column">
              <h2 className="title-display arcade-blink" style={{ fontSize: '1rem', marginBottom: '2.5rem', color: 'var(--green)' }}>P1 READY</h2>
              <button className="btn-precision" style={{ padding: '2rem 4rem', fontSize: '1.2rem' }} onClick={mode === 'OFFLINE' ? startRound : () => {
                if (!account) return alert("CONNECT WALLET TO ENTER ARENA");
                navigate(`/duel?opponent=${BOT_ADDRESS}&stake=0.01`);
              }}>
                {mode === 'OFFLINE' ? 'START' : 'CHALLENGE'}
              </button>
            </div>
          )}

          {stage === 'COUNTDOWN' && (
            <div className="flex-center column">
              <span className="stat-label">GET READY</span>
              <span className="title-display arcade-blink" style={{ fontSize: '8rem', color: 'var(--cyan)', marginTop: '1rem' }}>
                {countdown > 0 ? countdown : 'GO!'}
              </span>
            </div>
          )}

          {(stage === 'WAIT' || stage === 'FIRE') && (
            <div className="flex-center column" style={{ position: 'relative', width: '100%' }}>
              <h2 className="title-display arcade-blink" style={{ fontSize: '1.2rem', marginBottom: '3.5rem', color: stage === 'FIRE' ? 'var(--green)' : 'var(--red)' }}>
                {stage === 'WAIT' ? 'WAIT...' : 'FIRE!!'}
              </h2>
              <button
                className="btn-precision neon-glow"
                style={{
                  width: '250px',
                  height: '250px',
                  borderRadius: '50%',
                  fontSize: '2rem',
                  borderColor: stage === 'FIRE' ? 'var(--green)' : 'var(--red)',
                  color: stage === 'FIRE' ? 'var(--green)' : 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 0 var(--bg-deep), 0 0 30px ${stage === 'FIRE' ? 'var(--green)' : 'var(--red)'}`
                }}
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
                  <h2 className="title-display" style={{ fontSize: '4rem', color: getGrade(reactionMs!, DIFFICULTIES[difficulty].target).color }}>
                    {getGrade(reactionMs!, DIFFICULTIES[difficulty].target).label}
                  </h2>
                  <span className="numeric" style={{ fontSize: '2rem', marginTop: '1rem', color: '#fff' }}>[{reactionMs}ms]</span>
                  {reactionMs === personalBest && (
                    <div className="arcade-blink" style={{ color: 'var(--gold)', fontSize: '0.6rem', marginTop: '1rem', fontFamily: 'var(--font-display)' }}>
                      NEW RECORD!!
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <h2 className="title-display arcade-blink" style={{ fontSize: '2.5rem', color: 'var(--red)' }}>DQ!!</h2>
                  <p className="stat-label" style={{ marginTop: '1.5rem' }}>EALRY RELEASE DETECTED</p>
                </div>
              )}
              <button className="btn-precision" style={{ marginTop: '3rem', padding: '1rem 3rem' }} onClick={startRound}>AGAIN?</button>
            </div>
          )}
        </div>

        {/* Right: Settings & Stats */}
        <div style={{ padding: '3rem' }}>
          <h3 className="title-display" style={{ fontSize: '0.6rem', color: 'var(--cyan)', marginBottom: '1.5rem' }}>SELECT STAGE</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
            {(Object.entries(DIFFICULTIES) as [Difficulty, typeof DIFFICULTIES[Difficulty]][]).map(([key, d]) => (
              <button
                key={key}
                className="btn-precision"
                style={{
                  fontSize: '0.5rem',
                  padding: '1rem',
                  textAlign: 'left',
                  opacity: difficulty === key ? 1 : 0.4,
                  borderColor: difficulty === key ? d.color : 'var(--bg-deep)',
                  background: difficulty === key ? 'rgba(255,255,255,0.05)' : 'transparent',
                  boxShadow: difficulty === key ? `4px 4px 0 var(--bg-deep)` : 'none'
                }}
                onClick={() => { setDifficulty(key); setStage('IDLE'); }}
              >
                {d.stage}: {d.label} &gt;&gt; OBJ: &lt;{d.target}ms
              </button>
            ))}
          </div>

          <h3 className="title-display" style={{ fontSize: '0.6rem', color: 'var(--gold)', marginBottom: '1.5rem' }}>TOP SCORES</h3>
          <div className="stat-box" style={{ marginBottom: '1.5rem', borderLeft: 'none', borderRight: '4px solid var(--gold)', padding: '1rem' }}>
            <span className="stat-label" style={{ color: 'var(--gold)' }}>HIGHEST_SYNC</span>
            <div className="numeric" style={{ fontSize: '2rem', marginTop: '0.5rem', color: 'var(--gold)' }}>
              {personalBest ? `${personalBest}ms` : '---'}
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <span className="stat-label">PREV_SENTINEL_DATA</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {history.map((ms, i) => (
                <div key={i} className="numeric" style={{
                  fontSize: '0.6rem',
                  padding: '0.4rem 0.8rem',
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--purple)',
                  color: ms === personalBest ? 'var(--gold)' : 'var(--cyan)'
                }}>
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
