/**
 * Global scroll-velocity tracker.
 *
 * A single rAF loop measures how fast the page is scrolling (px/frame),
 * smooths it, and normalises it to roughly -1..1. Every WebGL gallery plane
 * reads the same value to drive its warp + RGB-split — so the whole gallery
 * reacts to scroll as one material, and the value settles to exactly 0 when
 * the page is still (keeping the planes pixel-locked to the DOM at rest).
 */
let velocity = 0;         // smoothed, normalised
let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
let lastInstant = 0;
let running = false;

const MAX_PX_PER_FRAME = 90; // fling speed that maps to |velocity| = 1

const tick = () => {
    const y = window.scrollY;
    const instant = y - lastScrollY;
    lastScrollY = y;

    // Smooth the raw delta, then decay toward zero so a fling eases out
    // instead of snapping.
    lastInstant += (instant - lastInstant) * 0.35;
    const normalised = Math.max(-1, Math.min(1, lastInstant / MAX_PX_PER_FRAME));
    velocity += (normalised - velocity) * 0.18;
    if (Math.abs(velocity) < 0.0004) velocity = 0;

    requestAnimationFrame(tick);
};

export const startScrollTracker = () => {
    if (running || typeof window === 'undefined') return;
    running = true;
    lastScrollY = window.scrollY;
    requestAnimationFrame(tick);
};

export const getScrollVelocity = () => velocity;
