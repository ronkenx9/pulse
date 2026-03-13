import { useEffect, useRef, useState } from 'react';

const CYCLE_MS = Math.round((60 / 68) * 1000); // 882ms @ 68 BPM

export function HeartbeatBar() {
  const [beat, setBeat] = useState(false);
  const tickRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (tickRef.current) return;
      tickRef.current = true;
      setBeat(true);
      setTimeout(() => { setBeat(false); tickRef.current = false; }, 120);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`hb-bar${beat ? ' hb-bar--beat' : ''}`} aria-hidden="true">
      <svg className="hb-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <pattern id="hbpat" x="0" y="0" width="80" height="18" patternUnits="userSpaceOnUse">
            {/* PQRST waveform segment */}
            <path
              d="M0,9 L12,9 L14,7 L16,9 L18,9 L19,10.5 L21,3 L23,15 L25,9 L36,9 Q39,6 42,9 L80,9"
              stroke="rgba(0,255,136,0.35)"
              strokeWidth="1"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="18" fill="url(#hbpat)" />
      </svg>
    </div>
  );
}
