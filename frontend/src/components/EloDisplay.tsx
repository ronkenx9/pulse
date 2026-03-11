import { useState, useEffect } from "react";
import { PULSE_GAME_ADDRESS, pulseGameAbi } from "../lib/contracts";
import { createPublicClient, http } from "viem";
import { somniaTestnet } from "../lib/chain";

const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });

export function EloDisplay({ player }: { player: string }) {
    const [elo, setElo] = useState<number>(1000);
    const [flickering, setFlickering] = useState(false);

    useEffect(() => {
        if (!player) return;
        publicClient.readContract({
            address: PULSE_GAME_ADDRESS as `0x${string}`,
            abi: pulseGameAbi,
            functionName: "getElo",
            args: [player as `0x${string}`]
        }).then((val: any) => {
            const num = Number(val) / 100;
            if (num !== elo) {
                setFlickering(true);
                setElo(num);
                setTimeout(() => setFlickering(false), 1000);
            }
        });
    }, [player]);

    return (
        <div style={{ textAlign: 'right' }}>
            <p>RANKING</p>
            <h2 className={`numeric ${flickering ? 'elo-updating' : ''}`} style={{ fontSize: '2.5rem' }}>
                {Math.round(elo)}
            </h2>
        </div>
    );
}
