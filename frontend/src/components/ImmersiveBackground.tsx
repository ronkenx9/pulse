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

    // Parallax tilt calculation
    const tiltX = (mouse.y / window.innerHeight - 0.5) * 10;
    const tiltY = (mouse.x / window.innerWidth - 0.5) * -10;

    // Particle System
    const particles = useMemo(() => {
        return Array.from({ length: 100 }, () => ({
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
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;

        const render = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                // Move
                p.x += p.vx;
                p.y += p.vy;

                // Wrap
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Mouse avoidance
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    p.x -= dx * 0.01;
                    p.y -= dy * 0.01;
                }

                // Pulse scale
                const pulseScale = pulse % 2 === 0 ? 1.5 : 1;

                // Draw
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.4;
                ctx.fillRect(p.x, p.y, p.size * pulseScale, p.size * pulseScale);

                // Lines
                particles.forEach(other => {
                    const odx = p.x - other.x;
                    const ody = p.y - other.y;
                    const odist = Math.sqrt(odx * odx + ody * ody);
                    if (odist < 80) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = p.color;
                        ctx.globalAlpha = 0.1 * (1 - odist / 80);
                        ctx.stroke();
                    }
                });
            });

            animationFrame = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrame);
    }, [mouse, pulse, particles]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: 'var(--bg-deep)',
            perspective: '1000px',
            overflow: 'hidden'
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
                transition: 'transform 0.1s ease-out'
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
                    mixBlendMode: 'screen'
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
