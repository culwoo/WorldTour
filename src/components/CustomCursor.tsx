import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.scss';

const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);
    const isDesktopCandidate = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const ua = navigator.userAgent;
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            const isWideScreen = window.innerWidth > 1024;

            // Candidate checks: Must be wide screen and not a known mobile UA.
            if (isWideScreen && !isMobileUA) {
                isDesktopCandidate.current = true;
                // Enable by default if candidate
                setIsDesktop(true);
            }

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

            // We use global listeners for toggling capability
            window.addEventListener('touchstart', handleTouch);
            window.addEventListener('mousemove', handleMouseMoveGlobal);

            return () => {
                window.removeEventListener('touchstart', handleTouch);
                window.removeEventListener('mousemove', handleMouseMoveGlobal);
            };
        }
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
