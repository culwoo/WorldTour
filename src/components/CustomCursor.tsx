import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.scss';

const LONG_PRESS_DELAY = 250;

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    opacity: number;
    hue: number;
}

const detectDesktopCandidate = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isWideScreen = window.innerWidth > 1024;
    return isWideScreen && !isMobileUA;
};

const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number>(0);

    const [hovered, setHovered] = useState(false);
    const [isBlackhole, setIsBlackhole] = useState(false);
    const [isDesktop, setIsDesktop] = useState(detectDesktopCandidate);
    const [hasMoved, setHasMoved] = useState(false);
    const isDesktopCandidate = useRef(isDesktop);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Desktop/Mobile Detection
    useEffect(() => {
        if (typeof window === 'undefined') return;
        isDesktopCandidate.current = detectDesktopCandidate();

        const handleTouch = () => {
            setIsDesktop(false);
            document.body.classList.remove('desktop-cursor-enabled');
        };
        const handleMouseMoveGlobal = () => {
            if (isDesktopCandidate.current) {
                setIsDesktop(true);
                document.body.classList.add('desktop-cursor-enabled');
            }
        };
        const handleResize = () => {
            const dc = detectDesktopCandidate();
            isDesktopCandidate.current = dc;
            if (!dc) setIsDesktop(false);
        };

        window.addEventListener('touchstart', handleTouch);
        window.addEventListener('mousemove', handleMouseMoveGlobal);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('touchstart', handleTouch);
            window.removeEventListener('mousemove', handleMouseMoveGlobal);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Sync body class
    useEffect(() => {
        if (isDesktop) {
            document.body.classList.add('desktop-cursor-enabled');
        } else {
            document.body.classList.remove('desktop-cursor-enabled');
        }
    }, [isDesktop]);

    // Movement, Hover, Long-Press
    useEffect(() => {
        if (!isDesktop) return;

        const moveCursor = (e: MouseEvent) => {
            if (!hasMoved) setHasMoved(true);
            const transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            if (cursorRef.current) {
                cursorRef.current.style.transform = transform;
            }
            if (glowRef.current) {
                glowRef.current.style.transform = transform;
            }
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('[data-hover-trigger]') ||
                window.getComputedStyle(target).cursor === 'pointer'
            ) {
                setHovered(true);
            } else {
                setHovered(false);
            }
        };

        const handlePointerDown = () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
            longPressTimer.current = setTimeout(() => {
                setIsBlackhole(true);
            }, LONG_PRESS_DELAY);
        };

        const handlePointerUp = () => {
            setIsBlackhole(false);
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);
        window.addEventListener('pointerdown', handlePointerDown, { capture: true });
        window.addEventListener('pointerup', handlePointerUp, { capture: true });
        window.addEventListener('pointercancel', handlePointerUp, { capture: true });

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [isDesktop, hasMoved]);

    // Particle canvas setup & animation loop
    useEffect(() => {
        if (!isDesktop) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            const dt = Math.min(currentTime - lastTime, 50);
            lastTime = currentTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (particlesRef.current.length > 0) {
                const dtFactor = dt / 16;

                particlesRef.current = particlesRef.current.filter(p => {
                    p.life -= dt;
                    if (p.life <= 0) return false;

                    p.x += p.vx * dtFactor;
                    p.y += p.vy * dtFactor;
                    p.vx *= Math.pow(0.96, dtFactor);
                    p.vy *= Math.pow(0.96, dtFactor);
                    p.vy += 0.04 * dtFactor;

                    const progress = p.life / p.maxLife;
                    const fadeEase = progress < 0.3 ? progress / 0.3 : 1;
                    const currentOpacity = p.opacity * fadeEase;
                    const currentSize = p.size * (0.2 + progress * 0.8);

                    // Outer glow halo
                    const glowRadius = currentSize * 4;
                    const gradient = ctx.createRadialGradient(
                        p.x, p.y, 0,
                        p.x, p.y, glowRadius
                    );
                    gradient.addColorStop(0, `hsla(${p.hue}, 35%, 85%, ${currentOpacity * 0.3})`);
                    gradient.addColorStop(0.5, `hsla(${p.hue}, 30%, 80%, ${currentOpacity * 0.1})`);
                    gradient.addColorStop(1, `hsla(${p.hue}, 30%, 80%, 0)`);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // Core particle
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${p.hue}, 25%, 92%, ${currentOpacity})`;
                    ctx.fill();

                    return true;
                });
            }

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animFrameRef.current);
        };
    }, [isDesktop]);

    // Click particle spawning
    useEffect(() => {
        if (!isDesktop) return;

        const spawnParticles = (e: MouseEvent) => {
            const count = 12 + Math.floor(Math.random() * 6);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
                const speed = 1.5 + Math.random() * 3.5;
                const lifetime = 500 + Math.random() * 500;
                particlesRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: lifetime,
                    maxLife: lifetime,
                    size: 1 + Math.random() * 2.5,
                    opacity: 0.5 + Math.random() * 0.5,
                    hue: 25 + Math.random() * 40,
                });
            }
        };

        window.addEventListener('mousedown', spawnParticles);
        return () => window.removeEventListener('mousedown', spawnParticles);
    }, [isDesktop]);

    if (!isDesktop) return null;

    const classes = [
        'custom-cursor-dot',
        hovered && !isBlackhole ? 'hovered' : '',
        isBlackhole ? 'blackhole' : '',
    ].filter(Boolean).join(' ');

    return (
        <>
            <canvas
                ref={canvasRef}
                className="cursor-particle-canvas"
            />
            <div
                ref={glowRef}
                className="cursor-glow"
                style={{ opacity: hasMoved ? 1 : 0 }}
            />
            <div
                ref={cursorRef}
                className={classes}
                style={{ opacity: hasMoved ? 1 : 0 }}
            />
        </>
    );
};

export default CustomCursor;
