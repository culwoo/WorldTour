import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.scss';

const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);

    useEffect(() => {
        // Check for touch/mobile device
        if (typeof window !== 'undefined') {
            const ua = navigator.userAgent;
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

            const isTouchDevice =
                window.matchMedia("(pointer: coarse)").matches ||
                ('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (window.innerWidth <= 1024) ||
                isMobileUA;
            setIsTouch(isTouchDevice);
        }
    }, []);

    useEffect(() => {
        if (isTouch) return;

        const moveCursor = (e: MouseEvent) => {
            if (!hasMoved) setHasMoved(true);
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if hovering over interactive elements
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
    }, [isTouch, hasMoved]);

    if (isTouch) return null;

    return (
        <div
            ref={cursorRef}
            className={`custom-cursor-dot ${hovered ? 'hovered' : ''}`}
            style={{ opacity: hasMoved ? 1 : 0 }}
        />
    );
};

export default CustomCursor;
