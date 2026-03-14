import React, { useEffect, useRef, useMemo } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';
import { usePulseSync } from '../hooks/usePulseSync';

/**
 * Arcade Immersive Background
 * Layer 0: 3D Tron Grid
 * Layer 1: Pixel Particle Canvas
 */
export const ImmersiveBackground: React.FC = () => {
    const mouse = useMousePosition();
    const pulse = usePulseSync();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Refs for performance - avoids useEffect re-triggers
    const mouseRef = useRef(mouse);
    const pulseRef = useRef(pulse);

    useEffect(() => { mouseRef.current = mouse; }, [mouse]);
    useEffect(() => { pulseRef.current = pulse; }, [pulse]);

    // Particle System
    const particles = useMemo(() => {
        return Array.from({ length: 80 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() > 0.8 ? 4 : 2,
            color: ['#ff2d7b', '#00f0ff', '#7b2dff', '#39ff14'][Math.floor(Math.random() * 4)],
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
        }));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false }); // Perf: no alpha for background
        if (!ctx) return;

        let animationFrame: number;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        const render = () => {
            const m = mouseRef.current;
            const p = pulseRef.current;

            // Deep background clear
            ctx.fillStyle = '#0a0a14';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const pulseScale = p % 2 === 0 ? 1.5 : 1;

            particles.forEach((part, i) => {
                // Move
                part.x += part.vx;
                part.y += part.vy;

                // Wrap
                if (part.x < 0) part.x = canvas.width;
                if (part.x > canvas.width) part.x = 0;
                if (part.y < 0) part.y = canvas.height;
                if (part.y > canvas.height) part.y = 0;

                // Mouse avoidance
                const dx = m.x - part.x;
                const dy = m.y - part.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 22500) { // 150^2
                    const dist = Math.sqrt(distSq);
                    part.x -= (dx / dist) * 1.5;
                    part.y -= (dy / dist) * 1.5;
                }

                // Draw Particle
                ctx.fillStyle = part.color;
                ctx.globalAlpha = 0.4;
                ctx.fillRect(part.x, part.y, part.size * pulseScale, part.size * pulseScale);

                // Lines optimization: only check next particles
                for (let j = i + 1; j < particles.length; j++) {
                    const other = particles[j];
                    const odx = part.x - other.x;
                    const ody = part.y - other.y;
                    const odistSq = odx * odx + ody * ody;
                    if (odistSq < 6400) { // 80^2
                        const odist = Math.sqrt(odistSq);
                        ctx.beginPath();
                        ctx.moveTo(part.x, part.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = part.color;
                        ctx.globalAlpha = 0.08 * (1 - odist / 80);
                        ctx.stroke();
                    }
                }
            });

            animationFrame = requestAnimationFrame(render);
        };

        render();
        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', handleResize);
        };
    }, [particles]); // ONLY depends on particles setup

    // Derived tilt for the grid layer - use refs or state? 
    // State-based tilt is actually OK for the CSS layer because it's hardware accelerated
    const tiltY = (mouse.x / window.innerWidth - 0.5) * -10;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: 'var(--bg-deep)',
            perspective: '1000px',
            overflow: 'hidden',
            pointerEvents: 'none'
        }}>
            {/* Layer 0: Tron Grid */}
            <div style={{
                position: 'absolute',
                bottom: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `
                    linear-gradient(var(--purple) 1px, transparent 1px),
                    linear-gradient(90deg, var(--purple) 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px',
                transform: `rotateX(60deg) translateZ(-200px) rotateZ(${tiltY * 0.5}deg)`,
                opacity: 0.1,
                transition: 'transform 0.1s ease-out',
                willChange: 'transform'
            }} />

            {/* Grid Pulse Mask */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at ${mouse.x}px ${mouse.y}px, rgba(123, 45, 255, 0.1) 0%, transparent 60%)`,
                pointerEvents: 'none'
            }} />

            {/* Layer 1: Particles */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    mixBlendMode: 'screen',
                    pointerEvents: 'none'
                }}
            />

            {/* CRT Vignette (Local) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 110%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
};
