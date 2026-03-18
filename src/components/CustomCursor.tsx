import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.scss';

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
    const [isDesktop, setIsDesktop] = useState(detectDesktopCandidate);
    const [hasMoved, setHasMoved] = useState(false);
    const isDesktopCandidate = useRef(isDesktop);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        isDesktopCandidate.current = detectDesktopCandidate();

        // Hybrid Handling:
        // 1. If touch happens, disable cursor (user is using touchscreen)
        const handleTouch = () => {
            setIsDesktop(false);
            document.body.classList.remove('desktop-cursor-enabled');
        };

        // 2. If mouse moves, and we are a desktop candidate, re-enable cursor
        const handleMouseMoveGlobal = () => {
            if (isDesktopCandidate.current) {
                setIsDesktop(true);
                document.body.classList.add('desktop-cursor-enabled');
            }
        };

        // 3. Keep candidate in sync when viewport changes
        const handleResize = () => {
            const desktopCandidate = detectDesktopCandidate();
            isDesktopCandidate.current = desktopCandidate;
            if (!desktopCandidate) {
                setIsDesktop(false);
            }
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

    useEffect(() => {
        // Toggle body class logic sync with state
        if (isDesktop) {
            document.body.classList.add('desktop-cursor-enabled');
        } else {
            document.body.classList.remove('desktop-cursor-enabled');
        }
    }, [isDesktop]);

    useEffect(() => {
        // Effect for moving the actual cursor visual
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

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [isDesktop, hasMoved]);

    if (!isDesktop) return null;

    return (
        <div
            ref={cursorRef}
            className={`custom-cursor-dot ${hovered ? 'hovered' : ''}`}
            style={{ opacity: hasMoved ? 1 : 0 }}
        />
    );
};

export default CustomCursor;
