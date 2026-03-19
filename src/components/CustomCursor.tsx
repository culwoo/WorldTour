import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.scss';

const LONG_PRESS_DELAY = 250;

const detectDesktopCandidate = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isWideScreen = window.innerWidth > 1024;
    return isWideScreen && !isMobileUA;
};

const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
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
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
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

    if (!isDesktop) return null;

    const classes = [
        'custom-cursor-dot',
        hovered && !isBlackhole ? 'hovered' : '',
        isBlackhole ? 'blackhole' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={cursorRef}
            className={classes}
            style={{ opacity: hasMoved ? 1 : 0 }}
        />
    );
};

export default CustomCursor;
