import { useLiveFeed } from '../hooks/useLiveFeed';

export function MatchFeed() {
  const { entries, loading } = useLiveFeed();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {loading && (
        <p className="stat-label">SCANNING_NEURAL_BUS...</p>
      )}
      {!loading && entries.length === 0 && (
        <p className="stat-label">NO_RECORDS_FOUND</p>
      )}
      {entries.map(e => (
        <div key={e.id} className="stat-box" style={{ padding: '0.4rem 0.8rem', borderLeftWidth: '2px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span className="stat-label" style={{ fontSize: '0.55rem' }}>{e.time}</span>
            <span className="stat-label" style={{ fontSize: '0.55rem', color: e.isFalseStart ? 'var(--red)' : 'var(--green)' }}>
              {e.isFalseStart ? 'SYNC_ERR' : 'COMPLETE'}
            </span>
          </div>
          <div className="numeric" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
            {e.isFalseStart ? (
              <span style={{ color: 'var(--red)' }}>
                {e.loser.slice(0, 8)}: FALSE START
              </span>
            ) : (
              <span>
                {e.winner.slice(0, 8)} <span style={{ opacity: 0.4 }}>&gt;</span> {e.loser.slice(0, 8)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
