import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { parseEther } from 'viem';
import { MatchFeed } from '../components/MatchFeed';
import { SignalZone } from '../components/SignalZone';
import { EloDisplay } from '../components/EloDisplay';
import { usePulseGame } from '../hooks/usePulseGame';

// Derive shareable base URL from current page origin
const BASE_URL = window.location.origin;

export function Duel() {
  const { account, createDuel, joinDuel } = usePulseGame();
  const [searchParams] = useSearchParams();

  // Stake in human-readable STT (e.g. "0.001")
  const [stakeSTT, setStakeSTT] = useState('0.001');

  // Open challenge state
  const [openChallengeId, setOpenChallengeId] = useState<string | null>(null);
  const [openChallenging, setOpenChallenging] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Direct challenge state
  const [showDirect, setShowDirect] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [directChallenging, setDirectChallenging] = useState(false);

  // Join state
  const [joinId, setJoinId] = useState('');
  const [joinInfo, setJoinInfo] = useState<{ stake: string } | null>(null);
  const [joining, setJoining] = useState(false);

  // Active duel
  const [activeDuelId, setActiveDuelId] = useState<string | null>(null);

  // Auto-fill from URL params
  useEffect(() => {
    // ?join=ID — pre-fill the join field (shared invite link)
    const paramId = searchParams.get('join');
    if (paramId) {
      setJoinId(paramId);
      setJoinInfo({ stake: stakeSTT });
    }

    // ?opponent=ADDRESS&stake=AMOUNT — pre-fill direct challenge (bot / Practice mode)
    const paramOpponent = searchParams.get('opponent');
    const paramStake    = searchParams.get('stake');
    if (paramOpponent && /^0x[0-9a-fA-F]{40}$/.test(paramOpponent)) {
      setOpponent(paramOpponent);
      setShowDirect(true); // auto-open the collapsible so user sees it immediately
      if (paramStake) setStakeSTT(paramStake);
    }
  }, [searchParams]); // eslint-disable-line

  // ── handlers ────────────────────────────────────────────────

  const handleOpenChallenge = async () => {
    setOpenChallenging(true);
    try {
      // address(0) = anyone can join
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const id = await createDuel('0x0000000000000000000000000000000000000000', stakeWei);
      if (id) setOpenChallengeId(id);
    } finally {
      setOpenChallenging(false);
    }
  };

  const handleCopyLink = () => {
    if (!openChallengeId) return;
    navigator.clipboard.writeText(`${BASE_URL}/duel?join=${openChallengeId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleDirectChallenge = async () => {
    if (!opponent || !/^0x[0-9a-fA-F]{40}$/.test(opponent)) return;
    setDirectChallenging(true);
    try {
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const id = await createDuel(opponent as `0x${string}`, stakeWei);
      if (id) setActiveDuelId(id);
    } finally {
      setDirectChallenging(false);
    }
  };

  const handleJoin = async () => {
    if (!joinId) return;
    setJoining(true);
    try {
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const tx = await joinDuel(joinId, stakeWei);
      if (tx) setActiveDuelId(joinId);
    } finally {
      setJoining(false);
    }
  };

  const handleEnterOpenDuel = () => {
    if (openChallengeId) setActiveDuelId(openChallengeId);
  };

  // ── wallet guard ─────────────────────────────────────────────
  if (!account) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem' }}>
        <h2 style={{ color: 'var(--cyan)', letterSpacing: '4px' }}>WALLET NOT CONNECTED</h2>
        <Link to="/">
          <button className="btn-primary" style={{ fontSize: '1rem', padding: '1rem 2rem' }}>
            ← BACK TO HOME
          </button>
        </Link>
      </div>
    );
  }

  // ── active duel ──────────────────────────────────────────────
  if (activeDuelId) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <div style={{ flex: '1', padding: '2rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button
                className="btn-primary"
                style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                onClick={() => setActiveDuelId(null)}
              >
                ← EXIT
              </button>
              <h2 style={{ color: 'var(--cyan)' }}>DUEL #{activeDuelId}</h2>
            </div>
            <EloDisplay player={account} />
          </div>
          <SignalZone duelId={activeDuelId} />
        </div>
        <div style={{ flex: '0 0 300px', borderLeft: '1px solid var(--purple)', padding: '1.5rem', overflow: 'auto' }}>
          <h3 style={{ color: 'var(--cyan)', marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '3px' }}>NEURAL_FEED</h3>
          <MatchFeed />
        </div>
      </div>
    );
  }

  // ── matchmaking lobby ────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Center — matchmaking */}
      <div style={{ flex: '1', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0' }}>

        {/* Header */}
        <div style={{ width: '100%', maxWidth: '560px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>← HOME</button>
          </Link>
          <EloDisplay player={account} />
          <Link to="/practice" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>PRACTICE</button>
          </Link>
        </div>

        <div className="panel" style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ color: 'var(--gold)', letterSpacing: '3px' }}>INITIALIZE DUEL</h3>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'rgba(200,200,232,0.4)' }}>
              {account.slice(0, 6)}···{account.slice(-4)}
            </span>
          </div>

          {/* Stake */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', letterSpacing: '2px', color: 'rgba(200,200,232,0.6)' }}>
              STAKE (STT)
            </label>
            <input
              className="duel-input"
              value={stakeSTT}
              onChange={e => setStakeSTT(e.target.value)}
              type="text"
              placeholder="0.001"
            />
            <span style={{ fontSize: '0.7rem', color: 'rgba(200,200,232,0.35)', marginTop: '0.3rem', display: 'block' }}>
              ≈ {(() => { try { return parseEther(stakeSTT || '0').toString(); } catch { return '—'; } })()} wei
            </span>
          </div>

          {/* ── OPEN CHALLENGE (primary) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!openChallengeId ? (
              <>
                <button
                  className="open-challenge-btn"
                  onClick={handleOpenChallenge}
                  disabled={openChallenging}
                >
                  {openChallenging ? '⏳  CREATING CHALLENGE...' : '⚡  OPEN CHALLENGE'}
                </button>
                <p style={{ fontSize: '0.72rem', color: 'rgba(200,200,232,0.4)', textAlign: 'center' }}>
                  Creates a duel anyone can join — share the link with your opponent
                </p>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="waiting-indicator">
                  <div className="waiting-spinner" />
                  WAITING FOR OPPONENT...
                </div>
                <div className="invite-link-box">
                  <span className="invite-link-text">{BASE_URL}/duel?join={openChallengeId}</span>
                  <button
                    className={`copy-btn ${linkCopied ? 'copy-btn--copied' : ''}`}
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? '✓ COPIED' : 'COPY'}
                  </button>
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleEnterOpenDuel}
                >
                  ENTER ARENA (WAIT INSIDE)
                </button>
              </div>
            )}
          </div>

          <hr style={{ borderColor: 'rgba(139,43,226,0.3)', margin: '0' }} />

          {/* ── JOIN VIA ID / LINK ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.8rem', letterSpacing: '2px', color: 'rgba(200,200,232,0.6)' }}>
              JOIN A DUEL
            </label>
            {joinInfo && joinId && (
              <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.3)', fontSize: '0.8rem', color: 'var(--green)' }}>
                ⚡ You've been invited to Duel #{joinId}. Stake: {stakeSTT} STT
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="duel-input duel-input--purple"
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
                placeholder="Duel ID"
                style={{ flex: 1 }}
              />
              <button
                className="btn-primary"
                onClick={handleJoin}
                disabled={joining || !joinId}
                style={{ whiteSpace: 'nowrap', opacity: joining || !joinId ? 0.5 : 1 }}
              >
                {joining ? '...' : 'JOIN COMBAT'}
              </button>
            </div>
          </div>

          <hr style={{ borderColor: 'rgba(139,43,226,0.3)', margin: '0' }} />

          {/* ── DIRECT CHALLENGE (collapsible) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="collapsible-header"
              onClick={() => setShowDirect(d => !d)}
            >
              <span>{showDirect ? '▼' : '▶'}</span>
              DIRECT CHALLENGE (ENTER ADDRESS)
            </button>
            {showDirect && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  className="duel-input"
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                  placeholder="0x opponent address"
                />
                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleDirectChallenge}
                  disabled={directChallenging || !opponent}
                >
                  {directChallenging ? 'SENDING...' : 'CHALLENGE'}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Practice mode link */}
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(200,200,232,0.35)', letterSpacing: '2px' }}>
          No opponent?{' '}
          <Link to="/practice" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>
            TRAIN IN PRACTICE MODE →
          </Link>
        </p>
      </div>

      {/* Right — match feed */}
      <div style={{ flex: '0 0 280px', borderLeft: '1px solid var(--purple)', padding: '1.5rem', overflow: 'auto' }}>
        <h3 style={{ color: 'var(--cyan)', marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '3px' }}>NEURAL_FEED</h3>
        <MatchFeed />
      </div>
    </div>
  );
}
