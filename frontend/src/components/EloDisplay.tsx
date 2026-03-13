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
        <div className="stat-box" style={{ borderLeftColor: 'var(--gold)' }}>
            <span className="stat-label">SYNC_LEVEL</span>
            <span className="stat-value numeric" style={{ color: 'var(--gold)' }}>
                {elo !== null ? elo : '---'}
            </span>
        </div>
    );
}
