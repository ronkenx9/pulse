export function HeartbeatLine() {
    return (
        <div className="ecg-line-container">
            <svg width="100%" height="80" preserveAspectRatio="none" viewBox="0 0 1000 80">
                <path
                    className="ecg-path"
                    d="M0,40 L100,40 L110,35 L120,45 L130,10 L140,70 L150,35 L160,45 L170,40 L270,40 L280,35 L290,45 L300,10 L310,70 L320,35 L330,45 L340,40 L440,40 L450,35 L460,45 L470,10 L480,70 L490,35 L500,45 L510,40 L610,40 L620,35 L630,45 L640,10 L650,70 L660,35 L670,45 L680,40 L780,40 L790,35 L800,45 L810,10 L820,70 L830,35 L840,45 L850,40 L950,40 L960,35 L970,45 L980,10 L990,70 L1000,40"
                />
            </svg>
        </div>
    );
}
