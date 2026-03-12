// PlayerList — removed hardcoded mock data.
// Lobby is intentionally minimal: a real live lobby would require
// an off-chain indexer or subgraph to track open DuelCreated events.
// For now we show a clean empty state with context.
export function PlayerList() {
  return (
    <div
      style={{
        height: '100%',
        borderRight: '1px solid var(--purple)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <h3 style={{ fontSize: '0.85rem', letterSpacing: '3px', color: 'var(--cyan)' }}>
        LOBBY_NODES
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.72rem',
          letterSpacing: '1px',
          color: 'rgba(200,200,232,0.3)',
          lineHeight: '1.8',
          marginTop: '0.5rem',
        }}
      >
        OPEN CHALLENGES<br />
        appear here when<br />
        opponents create duels.
        <br /><br />
        Share your invite link<br />
        to bring a challenger.
      </p>
    </div>
  );
}
