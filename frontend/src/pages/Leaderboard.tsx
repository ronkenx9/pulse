import { Link } from 'react-router-dom';

export function Leaderboard() {
    // Scaffolded for the demo, would pull from on-chain event indexer or subgraph
    const dummyLeaders = [
        { rank: 1, address: '0x91F...22A3', elo: 1845, w: 142, l: 30 },
        { rank: 2, address: '0x21F...90C1', elo: 1620, w: 91, l: 40 },
        { rank: 3, address: '0x1A4...B4E0', elo: 1590, w: 85, l: 45 },
        { rank: 4, address: '0x321...F31B', elo: 1440, w: 55, l: 20 },
        { rank: 5, address: '0x88F...10D1', elo: 1400, w: 40, l: 15 },
    ];

    return (
        <div style={{ padding: '4rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: 'var(--gold)', fontSize: '4rem' }}>HALL OF FAME</h1>
                <Link to="/">
                    <button className="btn-primary">BACK TO HQ</button>
                </Link>
            </div>

            <div className="panel" style={{ marginTop: '4rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--cyan)', borderBottom: '1px solid var(--purple)' }}>
                            <th style={{ padding: '1rem' }}>RANK</th>
                            <th style={{ padding: '1rem' }}>NODE</th>
                            <th style={{ padding: '1rem' }}>RATING</th>
                            <th style={{ padding: '1rem' }}>W/L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyLeaders.map((l) => (
                            <tr key={l.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <td style={{ padding: '1rem' }} className="numeric">{l.rank}</td>
                                <td style={{ padding: '1rem', fontFamily: 'var(--font-body)' }}>{l.address}</td>
                                <td style={{ padding: '1rem', color: 'var(--gold)' }} className="numeric">{l.elo}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: 'var(--green)' }}>{l.w}</span> 
                                    <span style={{ color: 'var(--text-primary)' }}> / </span> 
                                    <span style={{ color: 'var(--red)' }}>{l.l}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
