export function MatchFeed() {
    return (
        <div className="panel" style={{ marginTop: '2rem' }}>
            <h3>NEURAL_FEED</h3>
            <ul style={{ listStyle: 'none', marginTop: '1rem', fontSize: '0.9rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                    [<span className="numeric">14:02:11</span>] 0x112.. <span style={{color: 'var(--green)'}}>DEFEATED</span> 0x899..
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                    [<span className="numeric">14:00:45</span>] 0x4CA.. <span style={{color: 'var(--red)'}}>FALSE START</span>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                    [<span className="numeric">13:58:22</span>] 0x91F.. <span style={{color: 'var(--green)'}}>DEFEATED</span> 0x33A..
                </li>
            </ul>
        </div>
    );
}
