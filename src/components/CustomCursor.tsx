import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.scss';

const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    // Default to FALSE (hidden) to prevent mobile flash. Only show if proven desktop.
    const [isDesktop, setIsDesktop] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const ua = navigator.userAgent;
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
            const hasHover = window.matchMedia("(hover: hover)").matches;
            const isWideScreen = window.innerWidth > 1024;

            // Strict condition: Must have fine pointer, HOVER capability, wide screen, and NOT be a mobile UA.
            if (hasFinePointer && hasHover && isWideScreen && !isMobileUA) {
                setIsDesktop(true);
            }
        }
    }, []);

    // Toggle body class for system cursor hiding
    useEffect(() => {
        if (isDesktop) {
            document.body.classList.add('desktop-cursor-enabled');
        } else {
            document.body.classList.remove('desktop-cursor-enabled');
        }
    }, [isDesktop]);

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
