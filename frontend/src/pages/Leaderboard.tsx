import { Link } from 'react-router-dom';
import { useLeaderboard } from '../hooks/useLeaderboard';

const RANK_COLORS: Record<number, string> = { 1: 'var(--gold)', 2: 'var(--cyan)', 3: 'var(--purple)' };

export function Leaderboard() {
  const { leaders, loading } = useLeaderboard();

  return (
    <div className="flex-center column" style={{ padding: '4rem 2rem', minHeight: '100vh' }}>

      <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
        <Link to="/lobby">
          <button className="btn-precision" style={{ fontSize: '0.6rem' }}>← DISCONNECT_LOBBY</button>
        </Link>
      </div>

      <div className="pulse-breathing" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <span className="stat-label">GLOBAL_RANKING_STATION</span>
        <h1 className="title-display" style={{ fontSize: '3rem', marginTop: '0.5rem' }}>HALL OF FAME</h1>
      </div>

      <div className="panel" style={{ width: '100%', maxWidth: '1000px', padding: '0' }}>
        {loading && (
          <div className="flex-center column" style={{ padding: '4rem' }}>
            <span className="stat-label pulse-breathing">SCANNING_NEURAL_NODES...</span>
          </div>
        )}

        {!loading && leaders.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p className="stat-label" style={{ marginBottom: '1rem' }}>NO_WARRIOR_DATA_FOUND</p>
            <p style={{ fontSize: '0.7rem', opacity: 0.4, letterSpacing: '2px' }}>BE THE FIRST TO COMMIT BIOMETRIC DATA TO THE CHAIN.</p>
          </div>
        )}

        {leaders.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 240, 255, 0.05)', borderBottom: '1px solid var(--border-dim)' }}>
                {['RK', 'PILOT_NODE', 'SYNC_LVL', 'W/L_DELTA', 'EFFICIENCY'].map(h => (
                  <th key={h} className="stat-label" style={{ padding: '1rem', fontSize: '0.6rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaders.map(l => {
                const total = l.wins + l.losses;
                const winRate = total > 0 ? Math.round((l.wins / total) * 100) : 0;
                return (
                  <tr key={l.address} style={{ borderBottom: '1px solid var(--border-dim)', transition: 'background 0.2s' }}>
                    <td className="numeric" style={{ padding: '1.2rem 1rem', fontSize: '1.2rem', color: RANK_COLORS[l.rank] || 'white' }}>
                      {l.rank.toString().padStart(2, '0')}
                    </td>
                    <td className="numeric" style={{ padding: '1.2rem 1rem', fontSize: '0.8rem', opacity: 0.8 }}>
                      {l.shortAddr}
                    </td>
                    <td className="numeric" style={{ padding: '1.2rem 1rem', fontSize: '1.5rem', color: 'var(--gold)' }}>
                      {l.elo}
                    </td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <span className="numeric" style={{ color: 'var(--green)', fontSize: '1.1rem' }}>{l.wins}</span>
                      <span style={{ opacity: 0.2, margin: '0 0.5rem' }}>/</span>
                      <span className="numeric" style={{ color: 'var(--red)', fontSize: '1.1rem' }}>{l.losses}</span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                        <div style={{ height: '2px', width: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${winRate}%`, background: winRate >= 60 ? 'var(--green)' : winRate >= 40 ? 'var(--gold)' : 'var(--red)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                        <span className="numeric" style={{ fontSize: '0.9rem', opacity: 0.6 }}>{winRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '3rem', opacity: 0.4 }}>
        <p className="stat-label">RANKINGS DERIVED FROM REAL-TIME VALIDATION OF ON-CHAIN DUEL_RESOLVE EVENTS.</p>
      </div>

    </div>
  );
}
