import { useState, useEffect, useRef } from 'react';

export function useMousePosition() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const ref = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            ref.current = { x: e.clientX, y: e.clientY };
        };

        let animationFrameId: number;
        const update = () => {
            setPosition(ref.current);
            animationFrameId = requestAnimationFrame(update);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animationFrameId = requestAnimationFrame(update);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return position;
}
