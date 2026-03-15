import { Link } from 'react-router-dom';
import { useLeaderboard } from '../hooks/useLeaderboard';

const RANK_COLORS: Record<number, string> = {
  1: 'var(--gold)',
  2: 'var(--cyan)',
  3: 'var(--purple)'
};

export function Leaderboard() {
  const { leaders, loading, refresh } = useLeaderboard();

  return (
    <div className="flex-center column pixel-in" style={{ padding: '4rem 2rem', minHeight: '100vh', position: 'relative' }}>

      {/* ── Coin Return ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
        <Link to="/lobby">
          <button className="btn-precision" style={{ fontSize: '0.6rem' }}>← DISCONNECT</button>
        </Link>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <span className="stat-label" style={{ color: 'var(--magenta)' }}>PULSE SENTINELS</span>
        <h1 className="title-display" style={{ fontSize: '3rem', marginTop: '1rem', textShadow: '4px 4px 0 var(--purple), -2px -2px 0 var(--green)' }}>HALL OF FAME</h1>
        <button
          className="btn-precision"
          style={{ marginTop: '1.5rem', fontSize: '0.5rem', padding: '0.6rem 1.5rem', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
          onClick={refresh}
          disabled={loading}
        >
          {loading ? 'SCANNING...' : 'REFRESH SCORES'}
        </button>
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '1000px', padding: '0', border: '4px solid var(--bg-deep)', boxShadow: '0 0 0 4px var(--purple)' }}>
        <div className="panel-header-strip" style={{ background: 'var(--purple)' }} />

        {loading && (
          <div className="flex-center column" style={{ padding: '6rem' }}>
            <h2 className="title-display arcade-blink" style={{ fontSize: '1rem', color: 'var(--gold)' }}>LOADING HIGH SCORES...</h2>
            <div style={{ width: '300px', height: '10px', background: 'var(--bg-deep)', marginTop: '2rem', border: '2px solid var(--gold)', padding: '2px' }}>
              <div style={{
                height: '100%',
                background: 'var(--gold)',
                width: '60%',
                animation: 'stepped-progress 1.5s steps(8) infinite'
              }} />
            </div>
          </div>
        )}

        {!loading && leaders.length === 0 && (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <p className="title-display" style={{ fontSize: '0.8rem', color: 'var(--magenta)', marginBottom: '1.5rem' }}>NO RECORDS FOUND</p>
            <p className="stat-label">BE THE FIRST TO ENTER THE HALL OF FAME.</p>
          </div>
        )}

        {leaders.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '4px solid var(--bg-deep)' }}>
                {['#', 'PLAYER', 'SCORE', 'W/L', 'EFFICIENCY'].map(h => (
                  <th key={h} className="stat-label" style={{ padding: '1.5rem 1rem', fontSize: '0.7rem', color: 'var(--cyan)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaders.map(l => {
                const total = l.wins + l.losses;
                const winRate = total > 0 ? Math.round((l.wins / total) * 100) : 0;
                const isTop3 = l.rank <= 3;

                return (
                  <tr key={l.address} style={{
                    borderBottom: '4px solid var(--bg-deep)',
                    background: isTop3 ? `rgba(${l.rank === 1 ? '255,225,77' : l.rank === 2 ? '0,240,255' : '123,45,255'}, 0.05)` : 'transparent',
                    transition: 'all 0.2s'
                  }}>
                    <td style={{ padding: '1.5rem 1rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        color: RANK_COLORS[l.rank] || '#fff',
                        fontFamily: 'var(--font-display)',
                        fontSize: isTop3 ? '1rem' : '0.7rem'
                      }}>
                        {isTop3 ? (l.rank === 1 ? '1ST' : l.rank === 2 ? '2ND' : '3RD') : l.rank.toString().padStart(2, '0')}
                      </div>
                    </td>
                    <td className="numeric" style={{ padding: '1.5rem 1rem', fontSize: '1rem', color: isTop3 ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                      {l.shortAddr}
                    </td>
                    <td className="numeric" style={{ padding: '1.5rem 1rem', fontSize: '1.8rem', color: 'var(--gold)', textShadow: '2px 2px 0 #000' }}>
                      {l.elo}
                    </td>
                    <td style={{ padding: '1.5rem 1rem' }}>
                      <span className="numeric" style={{ color: 'var(--green)', fontSize: '1.2rem' }}>{l.wins}</span>
                      <span style={{ opacity: 0.2, margin: '0 0.8rem', fontSize: '1.2rem' }}>/</span>
                      <span className="numeric" style={{ color: 'var(--red)', fontSize: '1.2rem' }}>{l.losses}</span>
                    </td>
                    <td style={{ padding: '1.5rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                          height: '24px',
                          width: '120px',
                          background: 'var(--bg-deep)',
                          border: '2px solid rgba(255,255,255,0.1)',
                          padding: '2px',
                          display: 'flex'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${winRate}%`,
                            background: `repeating-linear-gradient(90deg, ${winRate >= 60 ? 'var(--green)' : winRate >= 40 ? 'var(--gold)' : 'var(--red)'} 0px, ${winRate >= 60 ? 'var(--green)' : winRate >= 40 ? 'var(--gold)' : 'var(--red)'} 8px, transparent 8px, transparent 10px)`,
                            transition: 'width 1s steps(10)'
                          }} />
                        </div>
                        <span className="numeric" style={{ fontSize: '1rem', color: 'var(--cyan)' }}>{winRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '4rem', opacity: 0.5, textAlign: 'center' }}>
        <p className="stat-label">ONLY THE STRONG SURVIVE IN THE SOMNIA LEDGER.</p>
        <p style={{ fontSize: '0.4rem', color: 'var(--magenta)', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>© 198X SOMNIA ARCADE TECH</p>
      </div>

    </div>
  );
}
