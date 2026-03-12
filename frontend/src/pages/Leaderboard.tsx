import { Link } from 'react-router-dom';
import { useLeaderboard } from '../hooks/useLeaderboard';

const RANK_COLORS: Record<number, string> = { 1: 'var(--gold)', 2: '#C0C0C0', 3: '#CD7F32' };

export function Leaderboard() {
  const { leaders, loading } = useLeaderboard();

  return (
    <div style={{ padding: '4rem', maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--gold)', fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>HALL OF FAME</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/duel"><button className="btn-primary">ENTER ARENA</button></Link>
          <Link to="/"><button className="btn-primary">← HOME</button></Link>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '3rem' }}>
        {loading && (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '0.8rem', letterSpacing: '3px',
            color: 'rgba(200,200,232,0.4)', padding: '2rem', textAlign: 'center',
            animation: 'numFlicker 1.5s infinite',
          }}>
            SCANNING CHAIN FOR WARRIORS...
          </p>
        )}

        {!loading && leaders.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.85rem', letterSpacing: '2px',
              color: 'rgba(200,200,232,0.4)', marginBottom: '1rem',
            }}>
              NO DUELS RECORDED YET
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(200,200,232,0.25)' }}>
              Be the first to fight. Your name will be immortalized here.
            </p>
          </div>
        )}

        {leaders.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--purple)' }}>
                {['RANK', 'NODE', 'RATING', 'W / L', 'WIN RATE'].map(h => (
                  <th key={h} style={{
                    padding: '1rem', fontFamily: 'var(--font-display)',
                    fontSize: '0.75rem', letterSpacing: '2px', color: 'var(--cyan)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaders.map(l => {
                const total = l.wins + l.losses;
                const winRate = total > 0 ? Math.round((l.wins / total) * 100) : 0;
                return (
                  <tr key={l.address} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '0.9rem', fontFamily: 'var(--font-numeric)', fontSize: '1.5rem', color: RANK_COLORS[l.rank] || 'var(--text-primary)' }}>
                      {l.rank}
                    </td>
                    <td style={{ padding: '0.9rem', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {l.shortAddr}
                    </td>
                    <td style={{ padding: '0.9rem', fontFamily: 'var(--font-numeric)', fontSize: '1.6rem', color: 'var(--gold)' }}>
                      {l.elo}
                    </td>
                    <td style={{ padding: '0.9rem' }}>
                      <span style={{ color: 'var(--green)', fontFamily: 'var(--font-numeric)', fontSize: '1.3rem' }}>{l.wins}</span>
                      <span style={{ color: 'rgba(200,200,232,0.3)' }}> / </span>
                      <span style={{ color: 'var(--red)', fontFamily: 'var(--font-numeric)', fontSize: '1.3rem' }}>{l.losses}</span>
                    </td>
                    <td style={{ padding: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          height: '4px', width: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: `${winRate}%`,
                            background: winRate >= 60 ? 'var(--green)' : winRate >= 40 ? 'var(--gold)' : 'var(--red)',
                            transition: 'width 0.5s',
                          }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-numeric)', fontSize: '1.1rem', color: 'rgba(200,200,232,0.6)' }}>
                          {winRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'rgba(200,200,232,0.25)', letterSpacing: '1px' }}>
        Rankings derived from on-chain DuelResolved events · Last ~50,000 blocks · ELO via contract
      </p>
    </div>
  );
}
