import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { parseEther } from 'viem';
import { MatchFeed } from '../components/MatchFeed';
import { SignalZone } from '../components/SignalZone';
import { EloDisplay } from '../components/EloDisplay';
import { usePulseGame } from '../hooks/usePulseGame';
import { startAmbient } from '../lib/audio';

const BASE_URL = window.location.origin;

export function Duel() {
  const { account, createDuel, joinDuel } = usePulseGame();
  const [searchParams] = useSearchParams();

  const [stakeSTT, setStakeSTT] = useState('0.001');
  const [openChallengeId, setOpenChallengeId] = useState<string | null>(null);
  const [openChallenging, setOpenChallenging] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showDirect, setShowDirect] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);
  const [activeDuelId, setActiveDuelId] = useState<string | null>(null);

  const autoOpponentRef = useRef<string | null>(null);
  const autoStakeRef = useRef<string | null>(null);
  const autoChallengedRef = useRef(false);

  useEffect(() => {
    startAmbient('ARENA');
  }, []);

  useEffect(() => {
    const paramId = searchParams.get('join');
    if (paramId) setJoinId(paramId);

    const paramOpponent = searchParams.get('opponent');
    const paramStake = searchParams.get('stake');
    if (paramOpponent && /^0x[0-9a-fA-F]{40}$/.test(paramOpponent)) {
      setOpponent(paramOpponent);
      if (paramStake) setStakeSTT(paramStake);
      autoOpponentRef.current = paramOpponent;
      autoStakeRef.current = paramStake ?? stakeSTT;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!account || autoChallengedRef.current || !autoOpponentRef.current) return;
    autoChallengedRef.current = true;
    const stakeVal = autoStakeRef.current ?? '0.001';
    let stakeWei: bigint;
    try { stakeWei = parseEther(stakeVal); } catch { stakeWei = parseEther('0.001'); }

    createDuel(autoOpponentRef.current as `0x${string}`, stakeWei.toString())
      .then(id => { if (id) setActiveDuelId(id); })
      .catch(() => { autoChallengedRef.current = false; });
  }, [account]);

  const handleOpenChallenge = async () => {
    setOpenChallenging(true);
    try {
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const id = await createDuel('0x0000000000000000000000000000000000000000', stakeWei);
      if (id) setOpenChallengeId(id);
    } finally { setOpenChallenging(false); }
  };

  const handleCopyLink = () => {
    if (!openChallengeId) return;
    navigator.clipboard.writeText(`${BASE_URL}/duel?join=${openChallengeId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleDirectChallenge = async () => {
    if (!opponent || !/^0x[0-9a-fA-F]{40}$/.test(opponent)) return;
    try {
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const id = await createDuel(opponent as `0x${string}`, stakeWei);
      if (id) setActiveDuelId(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async () => {
    if (!joinId) return;
    setJoining(true);
    try {
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const tx = await joinDuel(joinId, stakeWei);
      if (tx) setActiveDuelId(joinId);
    } finally { setJoining(false); }
  };

  if (activeDuelId) {
    return (
      <div className="flex-center" style={{ height: '100vh', overflow: 'hidden' }}>
        <div style={{ flex: '1', padding: '2rem', height: '100%', position: 'relative' }} className="pulse-tensed">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <button className="btn-precision" style={{ fontSize: '0.6rem' }} onClick={() => setActiveDuelId(null)}>← TERMINATE</button>
              <h2 className="title-display" style={{ fontSize: '1.2rem' }}>ARENA_SESSION_{activeDuelId}</h2>
            </div>
            <div className="stat-box">
              <span className="stat-label">PILOT_ELO</span>
              <EloDisplay player={account!} />
            </div>
          </div>
          <div className="panel" style={{ height: 'calc(100% - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SignalZone duelId={activeDuelId} />
          </div>
        </div>
        <div style={{ width: '320px', height: '100%', borderLeft: '1px solid var(--border-dim)', background: 'var(--bg-panel)', padding: '2rem' }}>
          <h3 className="title-display" style={{ fontSize: '0.7rem', color: 'var(--gold)', marginBottom: '2rem' }}>NEURAL FEED</h3>
          <MatchFeed />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-center column" style={{ height: '100vh', padding: '2rem' }}>

      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/lobby">
          <button className="btn-precision" style={{ fontSize: '0.6rem' }}>← LOBBY</button>
        </Link>
        <div className="stat-box">
          <span className="stat-label">BIOMETRIC_PROFILE</span>
          <EloDisplay player={account!} />
        </div>
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '800px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>

        <div className="flex-center column" style={{ borderRight: '1px solid var(--border-dim)', paddingRight: '3rem', alignItems: 'flex-start' }}>
          <h3 className="title-display" style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '2rem' }}>INITIALIZE ARENA</h3>

          <div style={{ width: '100%', marginBottom: '2rem' }}>
            <label className="stat-label" style={{ marginBottom: '0.5rem' }}>STAKE (STT)</label>
            <input
              type="text"
              value={stakeSTT}
              onChange={e => setStakeSTT(e.target.value)}
              className="numeric"
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--cyan)', color: 'var(--cyan)', fontSize: '2rem', width: '100%', outline: 'none', padding: '0.5rem 0' }}
            />
          </div>

          {!openChallengeId ? (
            <button
              className="btn-precision pulse-breathing"
              style={{ width: '100%', padding: '1.2rem', marginBottom: '1rem' }}
              onClick={handleOpenChallenge}
              disabled={openChallenging}
            >
              {openChallenging ? 'SYNCHRONIZING...' : 'ESTABLISH OPEN STAKE'}
            </button>
          ) : (
            <div style={{ width: '100%' }}>
              <div className="stat-box" style={{ borderColor: 'var(--gold)', marginBottom: '1rem' }}>
                <span className="stat-label">INVITATION LINK</span>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <input readOnly value={`${BASE_URL}/duel?join=${openChallengeId}`} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', padding: '0.5rem', flex: 1, fontSize: '0.7rem' }} />
                  <button className="btn-precision" style={{ padding: '0.5rem 1rem' }} onClick={handleCopyLink}>{linkCopied ? 'COPIED' : 'COPY'}</button>
                </div>
              </div>
              <button className="btn-precision" style={{ width: '100%' }} onClick={() => setActiveDuelId(openChallengeId)}>ENTER STANDBY</button>
            </div>
          )}

          <p style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '1rem' }}>
            Anyone with the link can join this duel.
          </p>
        </div>

        <div className="flex-center column" style={{ alignItems: 'flex-start' }}>
          <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '2rem' }}>JOIN PRE-ESTABLISHED</h3>

          <div style={{ width: '100%', marginBottom: '2rem' }}>
            <label className="stat-label" style={{ marginBottom: '0.5rem' }}>SESSION_ID</label>
            <input
              type="text"
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              placeholder="0x00...000"
              className="numeric"
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--cyan)', color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', width: '100%', outline: 'none', padding: '0.5rem 0' }}
            />
          </div>

          <button
            className="btn-precision"
            style={{ width: '100%', padding: '1rem' }}
            onClick={handleJoin}
            disabled={joining || !joinId}
          >
            {joining ? 'LOCKING...' : 'JOIN COMBAT'}
          </button>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <h4 className="title-display" style={{ fontSize: '0.7rem', marginBottom: '1rem' }}>DIRECT LINK</h4>
            <div
              className="btn-precision"
              style={{ fontSize: '0.6rem', padding: '0.8rem', opacity: showDirect ? 1 : 0.5, cursor: 'pointer' }}
              onClick={() => setShowDirect(!showDirect)}
            >
              {showDirect ? 'HIDE_INPUT' : 'ENTER ADDRESS'}
            </div>
            {showDirect && (
              <div style={{ marginTop: '1rem', width: '100%' }}>
                <input
                  type="text"
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                  placeholder="0x..."
                  className="numeric"
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--cyan)', padding: '0.8rem', width: '100%', fontSize: '0.8rem', outline: 'none' }}
                />
                <button className="btn-precision" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleDirectChallenge}>CHALLENGE</button>
              </div>
            )}
          </div>
        </div>

      </div>

      <div style={{ marginTop: '3rem', opacity: 0.5 }}>
        <p className="stat-label">PRE-STAKE IS NON-REFUNDABLE UPON COMMENCEMENT.</p>
      </div>

    </div>
  );
}
