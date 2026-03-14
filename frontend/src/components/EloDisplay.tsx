import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { somniaTestnet } from '../lib/chain';
import { PULSE_GAME_ADDRESS, pulseGameAbi } from '../lib/contracts';

const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
});

export function EloDisplay({ player }: { player: `0x${string}` }) {
    const [elo, setElo] = useState<number | null>(null);

    useEffect(() => {
        publicClient.readContract({
            address: PULSE_GAME_ADDRESS as `0x${string}`,
            abi: pulseGameAbi,
            functionName: 'playerElo',
            args: [player],
        }).then(c => setElo(Number(c))).catch(() => { });
    }, [player]);

    return (
        <div className="flex-center" style={{ gap: '0.8rem' }}>
            <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 5px var(--gold))' }}>🌕</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="stat-label" style={{ color: 'var(--gold)', fontSize: '0.45rem' }}>POWER_LVL</span>
                <span className="numeric" style={{ color: 'var(--gold)', fontSize: '1.2rem', textShadow: '2px 2px 0 #000' }}>
                    {elo !== null ? elo : '0000'}
                </span>
            </div>
        </div>
    );
}
