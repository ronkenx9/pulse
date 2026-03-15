import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { parseEther, formatEther } from 'viem';
import { MatchFeed } from '../components/MatchFeed';
import { SignalZone } from '../components/SignalZone';
import { EloDisplay } from '../components/EloDisplay';
import { usePulseGame } from '../hooks/usePulseGame';
import { useToast } from '../components/Toast';
import { startBGM, playClick, playCopySuccess } from '../lib/audio';

const BOT_ADDRESS = '0x4EE45DA3868ba337AAD8B2803f325a2900EDb2a5';

type ArenaPhase = 'setup' | 'entering' | 'live';

export function Duel() {
  const { account, createDuel, joinDuel, getDuel } = usePulseGame();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stakeSTT, setStakeSTT] = useState('0.001');
  const [openChallengeId, setOpenChallengeId] = useState<string | null>(null);
  const [openChallenging, setOpenChallenging] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showDirect, setShowDirect] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);
  const [activeDuelId, setActiveDuelId] = useState<string | null>(null);
  const [duelStatus, setDuelStatus] = useState<'OPEN' | 'ARMED_PENDING' | 'ARMED' | null>(null);
  const [isBotChallenge, setIsBotChallenge] = useState(false);
  const [autoCreating, setAutoCreating] = useState(false);
  const [arenaPhase, setArenaPhase] = useState<ArenaPhase>('setup');

  const autoOpponentRef = useRef<string | null>(null);
  const autoStakeRef = useRef<string | null>(null);
  const autoChallengedRef = useRef(false);

  useEffect(() => {
    startBGM('ARENA');
  }, []);

  // Parse URL params
  useEffect(() => {
    const paramId = searchParams.get('join');
    const paramOpponent = searchParams.get('opponent');
    const paramStake = searchParams.get('stake');

    if (paramId) {
      setJoinId(paramId);
      if (paramStake) setStakeSTT(paramStake);
    }

    if (paramOpponent && /^0x[0-9a-fA-F]{40}$/.test(paramOpponent)) {
      setOpponent(paramOpponent);
      if (paramStake) setStakeSTT(paramStake);
      autoOpponentRef.current = paramOpponent;
      autoStakeRef.current = paramStake ?? stakeSTT;
      setIsBotChallenge(paramOpponent.toLowerCase() === BOT_ADDRESS.toLowerCase());
    }
  }, [searchParams]);

  // Poll duel state during bot challenge
  useEffect(() => {
    if (!activeDuelId || !isBotChallenge) return;
    const poll = setInterval(async () => {
      const duel = await getDuel(activeDuelId);
      if (!duel) return;
      if (duel.state === 0) setDuelStatus('OPEN');
      else if (duel.state === 1) setDuelStatus('ARMED_PENDING');
      else if (duel.state === 2) { setDuelStatus('ARMED'); clearInterval(poll); }
      else clearInterval(poll);
    }, 3000);
    return () => clearInterval(poll);
  }, [activeDuelId, isBotChallenge]);

  // Auto-fetch stake from chain when joining via link
  useEffect(() => {
    if (!joinId) return;
    getDuel(joinId).then(duel => {
      if (duel?.stake && duel.stake > 0n) {
        setStakeSTT(formatEther(duel.stake));
      }
    });
  }, [joinId]);

  // Auto-create duel from URL params (bot challenge)
  useEffect(() => {
    if (!account || autoChallengedRef.current || !autoOpponentRef.current) return;
    autoChallengedRef.current = true;
    setAutoCreating(true);

    const stakeVal = autoStakeRef.current ?? '0.001';
    let stakeWei: bigint;
    try { stakeWei = parseEther(stakeVal); } catch { stakeWei = parseEther('0.001'); }

    createDuel(autoOpponentRef.current as `0x${string}`, stakeWei.toString())
      .then(id => {
        if (id) {
          setActiveDuelId(id);
          // Clear URL params so bookmarks don't re-create
          setSearchParams({}, { replace: true });
          toast('DUEL CREATED — ENTERING ARENA', 'success');
        }
        setAutoCreating(false);
      })
      .catch((err) => {
        toast('DUEL CREATION FAILED — ' + (err?.shortMessage || err?.message || 'CHECK WALLET'), 'error');
        autoChallengedRef.current = false;
        setAutoCreating(false);
      });
  }, [account]);

  // Stake validation
  const stakeError = (() => {
    if (!stakeSTT) return null;
    const n = Number(stakeSTT);
    if (isNaN(n) || n < 0) return 'INVALID AMOUNT';
    if (n > 0 && n < 0.0001) return 'MIN STAKE: 0.0001 STT';
    if (n > 10000) return 'MAX STAKE: 10,000 STT';
    return null;
  })();

  // Arena entry transition
  const enterArena = (duelId: string) => {
    playClick();
    setActiveDuelId(duelId);
    setArenaPhase('entering');
    // Clear URL params
    setSearchParams({}, { replace: true });
    setTimeout(() => setArenaPhase('live'), 2000);
  };

  const handleOpenChallenge = async () => {
    if (stakeError) { toast(stakeError, 'warning'); return; }
    setOpenChallenging(true);
    playClick();
    try {
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const id = await createDuel('0x0000000000000000000000000000000000000000', stakeWei);
      if (id) {
        setOpenChallengeId(id);
        toast('CHALLENGE BROADCAST — SHARE YOUR LINK', 'success');
      }
    } catch (err: any) {
      toast('CREATE FAILED — ' + (err?.shortMessage || err?.message || 'CHECK WALLET'), 'error');
    } finally { setOpenChallenging(false); }
  };

  const handleCopyLink = () => {
    if (!openChallengeId) return;
    const url = `${window.location.origin}/duel?join=${openChallengeId}&stake=${stakeSTT}`;

    const onSuccess = () => {
      playCopySuccess();
      setLinkCopied(true);
      toast('LINK COPIED TO CLIPBOARD', 'success', 2000);
      setTimeout(() => setLinkCopied(false), 2000);
    };

    // Step 1: Synchronous execCommand FIRST — must run while user gesture is active
    let copied = false;
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      // Must be visible enough for the browser to allow selection
      ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;font-size:12pt;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, url.length); // iOS Safari needs this
      copied = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch { /* ignore */ }

    if (copied) {
      onSuccess();
      return;
    }

    // Step 2: Try Clipboard API (async, may work on HTTPS with permissions)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(onSuccess).catch(() => {
        // Step 3: Last resort — prompt so user can manually Ctrl+C
        window.prompt('COPY THIS LINK:', url);
        onSuccess();
      });
    } else {
      window.prompt('COPY THIS LINK:', url);
      onSuccess();
    }
  };

  const handleDirectChallenge = async () => {
    if (!opponent || !/^0x[0-9a-fA-F]{40}$/.test(opponent)) {
      toast('INVALID WALLET ADDRESS', 'warning');
      return;
    }
    if (stakeError) { toast(stakeError, 'warning'); return; }
    playClick();
    try {
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const id = await createDuel(opponent as `0x${string}`, stakeWei);
      if (id) {
        toast('DUEL INITIATED', 'success');
        enterArena(id);
      }
    } catch (err: any) {
      toast('DUEL FAILED — ' + (err?.shortMessage || err?.message || 'CHECK WALLET'), 'error');
    }
  };

  const handleJoin = async () => {
    if (!joinId) return;
    if (!/^\d+$/.test(joinId)) { toast('INVALID TICKET ID — MUST BE NUMERIC', 'warning'); return; }
    if (stakeError) { toast(stakeError, 'warning'); return; }
    setJoining(true);
    playClick();
    try {
      const stakeWei = parseEther(stakeSTT || '0.001').toString();
      const tx = await joinDuel(joinId, stakeWei);
      if (tx) {
        toast('JOINED DUEL — ENTERING ARENA', 'success');
        enterArena(joinId);
      }
    } catch (err: any) {
      toast('JOIN FAILED — ' + (err?.shortMessage || err?.message || 'CHECK WALLET'), 'error');
    } finally { setJoining(false); }
  };

  // ═══ ARENA ENTRY TRANSITION ═══
  if (arenaPhase === 'entering' && activeDuelId) {
    return (
      <div className="flex-center column" style={{
        height: '100vh', background: 'var(--bg-deep)',
        position: 'relative', overflow: 'hidden',
      }}>
        <style>{`
          @keyframes arena-gate {
            0% { transform: scaleY(0); }
            30% { transform: scaleY(1); }
            70% { transform: scaleY(1); }
            100% { transform: scaleY(0); opacity: 0; }
          }
          @keyframes arena-text {
            0% { opacity: 0; transform: scale(0.5); }
            20% { opacity: 1; transform: scale(1); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: scale(1.5); }
          }
        `}</style>

        {/* Horizontal scan lines */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '45%', height: '10%',
          background: 'var(--magenta)', animation: 'arena-gate 2s ease-in-out forwards',
          transformOrigin: 'center',
        }} />

        <div style={{ animation: 'arena-text 2s ease-in-out forwards', textAlign: 'center' }}>
          <h1 className="title-display" style={{ fontSize: '3rem', color: 'var(--magenta)', marginBottom: '1rem' }}>
            ENTERING ARENA
          </h1>
          <p className="stat-label" style={{ color: 'var(--cyan)' }}>
            DUEL #{activeDuelId} :: NEURAL SYNC ACTIVE
          </p>
        </div>
      </div>
    );
  }

  // ═══ LIVE ARENA ═══
  if (activeDuelId && arenaPhase !== 'entering') {
    return (
      <div className="flex-center pixel-in" style={{ height: '100vh', overflow: 'hidden' }}>
        <div style={{ flex: '1', padding: '1rem 2rem', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* HUD */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem', background: 'var(--bg-panel)', borderBottom: '4px solid var(--magenta)',
            marginBottom: '1rem', boxShadow: '0 4px 0 var(--bg-deep)', flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '2rem', minWidth: 0 }}>
              <div style={{ border: '2px solid var(--magenta)', padding: '0.4rem 0.8rem' }}>
                <span className="stat-label" style={{ color: 'var(--magenta)' }}>P1</span>
                <span className="numeric" style={{ marginLeft: '1rem', fontSize: '0.8rem' }}>{account?.slice(0, 6)}...</span>
              </div>
              <div className="stat-box" style={{ padding: '0.4rem 0.8rem' }}>
                <span className="stat-label">POWER</span>
                <EloDisplay player={account!} />
              </div>
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <div className="title-display" style={{ fontSize: '1rem', color: 'var(--gold)' }}>ROUND 01</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--cyan)', marginTop: '0.2rem' }}>SESSION_{activeDuelId.slice(-4)}</div>
              {isBotChallenge && duelStatus === 'OPEN' && (
                <div className="arcade-blink" style={{ fontSize: '0.4rem', color: 'var(--gold)', marginTop: '0.3rem' }}>BOT JOINING...</div>
              )}
              {isBotChallenge && duelStatus === 'ARMED_PENDING' && (
                <div className="arcade-blink" style={{ fontSize: '0.4rem', color: 'var(--red)', marginTop: '0.3rem' }}>SIGNAL IMMINENT</div>
              )}
            </div>

            <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: '2rem' }}>
              <button
                className="btn-precision"
                style={{ fontSize: '0.5rem', padding: '0.4rem 1rem', boxShadow: '0 4px 0 var(--red)', border: '2px solid var(--red)', background: 'rgba(255,0,0,0.1)' }}
                onClick={() => { setActiveDuelId(null); setArenaPhase('setup'); navigate('/lobby'); }}
              >
                FORFEIT
              </button>
            </div>
          </div>

          {/* Main Arena */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SignalZone duelId={activeDuelId} />
          </div>
        </div>

        {/* Side Feed — hidden on mobile */}
        <div className="match-feed-sidebar" style={{
          width: '320px', height: '100%', borderLeft: '4px solid var(--bg-deep)',
          background: 'var(--bg-panel)', padding: '2rem', boxShadow: '-4px 0 0 var(--purple)',
        }}>
          <div className="panel-header-strip" style={{ background: 'var(--purple)' }} />
          <h3 className="title-display" style={{ fontSize: '0.6rem', color: 'var(--purple)', marginBottom: '2rem' }}>BATTLE LOG</h3>
          <MatchFeed />
        </div>
      </div>
    );
  }

  // ═══ SETUP ═══
  return (
    <div className="flex-center column pixel-in" style={{ height: '100vh', padding: '2rem' }}>

      {/* Auto-Initializing Bot Duel Overlay */}
      {autoCreating && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'var(--bg-deep)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="arcade-blink" style={{ color: 'var(--magenta)', fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '2rem' }}>
            SYNCING NEURAL LINK...
          </div>
          <p className="stat-label" style={{ color: 'var(--cyan)' }}>CHALLENGING_SOMNIA_AI_SENTINEL</p>
          <div style={{ marginTop: '3rem', width: '300px', height: '4px', background: 'var(--purple)', opacity: 0.3 }}>
            <div style={{ width: '60%', height: '100%', background: 'var(--magenta)', animation: 'marquee 2s linear infinite' }} />
          </div>
          <p style={{ marginTop: '2rem', fontSize: '0.6rem', opacity: 0.5 }}>PLEASE CONFIRM ON-CHAIN STAKE IN WALLET</p>
          <button
            className="btn-precision"
            style={{ marginTop: '2rem', fontSize: '0.5rem', borderColor: 'var(--red)', color: 'var(--red)' }}
            onClick={() => { setAutoCreating(false); autoChallengedRef.current = false; navigate('/practice'); }}
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ width: '100%', maxWidth: '900px', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/lobby">
          <button className="btn-precision" style={{ fontSize: '0.6rem' }}>← DISCONNECT</button>
        </Link>
        <div className="stat-box" style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.5rem 1.5rem' }}>
          <span className="stat-label">NEURAL_ID</span>
          <EloDisplay player={account!} />
        </div>
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0', padding: 0 }}>
        <div className="panel-header-strip" style={{ background: 'var(--magenta)' }} />

        {/* Left: Create */}
        <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h3 className="title-display" style={{ fontSize: '1rem', color: 'var(--magenta)', marginBottom: '2.5rem' }}>CREATE DUEL</h3>

          <div style={{ width: '100%', marginBottom: '2.5rem' }}>
            <label className="stat-label" style={{ marginBottom: '0.8rem', display: 'block' }}>COIN_STAKE (STT)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'var(--gold)', fontSize: '1.5rem' }}>S</span>
              <input
                type="text"
                value={stakeSTT}
                onChange={e => setStakeSTT(e.target.value)}
                className="numeric"
                style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${stakeError ? 'var(--red)' : 'var(--magenta)'}`, color: stakeError ? 'var(--red)' : 'var(--magenta)', fontSize: '2rem', width: '100%', outline: 'none', padding: '0.5rem 0' }}
              />
            </div>
            {stakeError && (
              <p style={{ color: 'var(--red)', fontSize: '0.5rem', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>{stakeError}</p>
            )}
          </div>

          {!openChallengeId ? (
            <button
              className="btn-precision arcade-blink"
              style={{ width: '100%', padding: '1.2rem' }}
              onClick={handleOpenChallenge}
              disabled={openChallenging || !!stakeError}
            >
              {openChallenging ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                  <span className="spinner" /> BROADCASTING...
                </span>
              ) : 'CREATE OPEN DUEL'}
            </button>
          ) : (
            <div style={{ width: '100%', animation: 'pixel-in 0.3s steps(3)' }}>
              <div className="stat-box" style={{ borderColor: 'var(--gold)', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.5)' }}>
                <span className="stat-label">TICKET STUB</span>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem' }}>
                  <input readOnly value={`${window.location.origin}/duel?join=${openChallengeId}&stake=${stakeSTT}`} onClick={(e) => (e.target as HTMLInputElement).select()} style={{ background: 'var(--bg-deep)', border: '1px solid var(--cyan-dim, #1a3a4a)', color: 'var(--cyan)', padding: '0.5rem', flex: 1, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', cursor: 'text' }} />
                  <button className="btn-precision" style={{ padding: '0.5rem 1rem', fontSize: '0.5rem' }} onClick={handleCopyLink}>{linkCopied ? 'OK' : 'COPY'}</button>
                </div>
              </div>
              <button className="btn-precision" style={{ width: '100%', background: 'var(--gold)', color: 'var(--bg-deep)', border: 'none' }} onClick={() => enterArena(openChallengeId)}>ENTER ARENA</button>
            </div>
          )}
          <p style={{ marginTop: '1.5rem', fontSize: '0.5rem', color: 'var(--cyan)', opacity: 0.7, lineHeight: '1.4' }}>
            [ OPEN DUEL: ANYONE CAN JOIN VIA TICKET ID OR LINK. ]
          </p>
        </div>

        {/* Center: VS Divider */}
        <div style={{
          width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-deep)', position: 'relative', boxShadow: 'inset 0 0 20px rgba(0,0,0,1)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)',
            transform: 'rotate(-10deg)', textShadow: '4px 4px 0 var(--red)',
          }}>VS</div>
        </div>

        {/* Right: Join */}
        <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(0,0,0,0.2)' }}>
          <h3 className="title-display" style={{ fontSize: '1rem', color: 'var(--cyan)', marginBottom: '2.5rem' }}>JOIN DUEL</h3>

          <div style={{ width: '100%', marginBottom: '2.5rem' }}>
            <label className="stat-label" style={{ marginBottom: '0.8rem', display: 'block' }}>TICKET_ID</label>
            <input
              type="text"
              value={joinId}
              onChange={e => setJoinId(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123"
              className="numeric"
              style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--cyan)', color: 'var(--cyan)', fontSize: '1.2rem', width: '100%', outline: 'none', padding: '0.5rem 0' }}
            />
          </div>

          <button
            className="btn-precision"
            style={{ width: '100%', padding: '1rem', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
            onClick={handleJoin}
            disabled={joining || !joinId || !!stakeError}
          >
            {joining ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <span className="spinner" /> JOINING...
              </span>
            ) : 'JOIN DUEL'}
          </button>
          <p style={{ marginTop: '1rem', fontSize: '0.5rem', color: 'var(--cyan)', opacity: 0.7, lineHeight: '1.4' }}>
            [ JOIN: ENTER A SPECIFIC TICKET_ID TO ENTER THE FIGHT. ]
          </p>

          <div style={{ marginTop: 'auto', width: '100%' }}>
            <div
              style={{
                fontSize: '0.5rem', color: 'var(--purple)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', textAlign: 'center', padding: '1rem', border: '2px dashed var(--purple)',
              }}
              onClick={() => setShowDirect(!showDirect)}
            >
              {showDirect ? '[ HIDE PRIVATE ]' : '[ PRIVATE DUEL ]'}
            </div>
            {showDirect && (
              <div style={{ marginTop: '1rem', width: '100%', animation: 'pixel-in 0.2s steps(2)' }}>
                <input
                  type="text"
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                  placeholder="OPPONENT WALLET ADDR"
                  className="numeric"
                  style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'var(--gold)', padding: '0.8rem', width: '100%', fontSize: '0.7rem', outline: 'none', marginBottom: '0.5rem' }}
                />
                {opponent && !/^0x[0-9a-fA-F]{40}$/.test(opponent) && (
                  <div style={{ color: 'var(--red)', fontSize: '0.4rem', marginBottom: '0.5rem', textAlign: 'center' }}>[ INVALID ADDRESS FORMAT ]</div>
                )}
                {opponent.toLowerCase() === BOT_ADDRESS.toLowerCase() && (
                  <div style={{ color: 'var(--green)', fontSize: '0.4rem', marginBottom: '0.5rem', textAlign: 'center' }}>[ SOMNIA_SENTINEL_AI DETECTED ]</div>
                )}
                <button className="btn-precision" style={{ width: '100%', padding: '0.5rem', fontSize: '0.5rem' }} onClick={handleDirectChallenge}>INITIATE DUEL</button>
              </div>
            )}
            {!showDirect && (
              <div
                className="pixel-in"
                style={{
                  marginTop: '1rem', padding: '1rem',
                  background: 'rgba(57, 255, 20, 0.05)', border: '1px solid var(--green)', cursor: 'pointer',
                }}
                onClick={() => { setOpponent(BOT_ADDRESS); setShowDirect(true); }}
              >
                <div className="stat-label" style={{ color: 'var(--green)', fontSize: '0.4rem' }}>NEURAL_SENTINEL_ONLINE</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.6, marginTop: '0.4rem' }}>CHALLENGE THE AI BOT TO ON-CHAIN PRACTICE.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <p className="stat-label" style={{ color: 'var(--red)', animation: 'blink 1.5s infinite steps(2)' }}>
          [ PRO-TIP: WINNER TAKES ALL // FALSE START = FORFEIT ]
        </p>
      </div>
    </div>
  );
}
