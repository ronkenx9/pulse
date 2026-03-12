import { useLiveFeed } from '../hooks/useLiveFeed';

export function MatchFeed() {
  const { entries, loading } = useLiveFeed();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {loading && (
        <p className="feed-empty">SCANNING CHAIN...</p>
      )}
      {!loading && entries.length === 0 && (
        <p className="feed-empty">NO RECENT DUELS</p>
      )}
      {entries.map(e => (
        <div key={e.id} className="feed-entry feed-entry--new">
          <span className="feed-time">[{e.time}]</span>
          {e.isFalseStart ? (
            <span className="feed-result feed-result--false">
              {e.loser} FALSE START
            </span>
          ) : (
            <span className="feed-result feed-result--win">
              {e.winner} <span style={{ color: 'rgba(200,200,232,0.5)' }}>DEFEATED</span> {e.loser}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
