export function HeartbeatLine() {
    return (
        <div className="ecg-line-container" style={{ height: '100px', background: 'linear-gradient(to top, rgba(10,10,20,0.8), transparent)' }}>
            <svg width="100%" height="80" preserveAspectRatio="none" viewBox="0 0 1000 80">
                <style>{`
                  .arcade-path {
                    stroke: var(--magenta);
                    stroke-width: 4;
                    fill: none;
                    stroke-dasharray: 2000;
                    stroke-dashoffset: 2000;
                    animation: arcade-draw 8s linear infinite;
                    filter: drop-shadow(0 0 8px var(--magenta));
                  }
                  @keyframes arcade-draw {
                    to { stroke-dashoffset: 0; }
                  }
                `}</style>
                <path
                    className="arcade-path"
                    d="M0,40 H50 V10 H60 V70 H70 V40 H150 H200 V10 H210 V70 H220 V40 H300 H350 V10 H360 V70 H370 V40 H450 H500 V10 H510 V70 H520 V40 H600 H650 V10 H660 V70 H670 V40 H750 H800 V10 H810 V70 H820 V40 H900 H950 V10 H960 V70 H970 V40 L1000,40"
                />
            </svg>
        </div>
    );
}
