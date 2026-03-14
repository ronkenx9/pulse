import { useState, useEffect } from 'react';

export function usePulseSync() {
    const [pulse, setPulse] = useState(0);
    const CYCLE_MS = 882; // Matches --pulse-cycle in index.css

    useEffect(() => {
        const interval = setInterval(() => {
            setPulse(p => p + 1);
        }, CYCLE_MS);

        return () => clearInterval(interval);
    }, []);

    return pulse;
}
