import { useLiveFeed } from '../hooks/useLiveFeed';

export function MatchFeed() {
  const { entries, loading } = useLiveFeed();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {loading && (
        <p className="stat-label arcade-blink">SCANNING DATA...</p>
      )}
      {!loading && entries.length === 0 && (
        <p className="stat-label" style={{ opacity: 0.5 }}>NO RECENT BATTLES</p>
      )}
      {entries.map(e => (
        <div key={e.id} className="pixel-in" style={{
          background: 'rgba(0,0,0,0.3)',
          borderLeft: `4px solid ${e.isFalseStart ? 'var(--red)' : 'var(--green)'}`,
          padding: '0.8rem',
          position: 'relative',
          boxShadow: '2px 2px 0 var(--bg-deep)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="numeric" style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>{e.time}</span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.45rem',
              color: e.isFalseStart ? 'var(--red)' : 'var(--green)'
            }}>
              {e.isFalseStart ? 'DQ' : 'WIN'}
            </span>
          </div>

          <div className="numeric" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
            {e.isFalseStart ? (
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                {e.loser.slice(0, 8)} <span style={{ color: 'var(--red)' }}>X_SYNC</span>
              </span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--gold)' }}>{e.winner.slice(0, 8)}</span>
                <span style={{ opacity: 0.2, fontSize: '0.5rem' }}>▶</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{e.loser.slice(0, 8)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
