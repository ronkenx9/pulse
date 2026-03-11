export function PlayerList() {
    // In a real production app, this would poll a subgraph or rely on
    // an active sockets registry. For the hackathon MVP, we mock the lobby list
    // or fetch recent creators from viem event filters.
    
    return (
        <div className="panel" style={{ height: '100%', borderRight: '1px solid var(--purple)' }}>
            <h3>LOBBY_NODES</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid var(--green)' }}>
                    <p>0x91F...22A3</p>
                    <p className="numeric" style={{ color: 'var(--gold)' }}>ELO: 1140</p>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(255, 59, 59, 0.1)', border: '1px solid var(--red)' }}>
                    <p>0x4CA...B1D0 (CHALLENGING)</p>
                    <p className="numeric" style={{ color: 'var(--gold)' }}>ELO: 980</p>
                </div>
                <div style={{ padding: '0.5rem', border: '1px solid var(--text-primary)' }}>
                    <p>0x221...F31B</p>
                    <p className="numeric" style={{ color: 'var(--gold)' }}>ELO: 1000</p>
                </div>
            </div>
        </div>
    );
}
