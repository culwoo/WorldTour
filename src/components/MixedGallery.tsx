import React, { useMemo } from 'react';
import HorizontalGallery from './HorizontalGallery';
import ParallaxGallery from './ParallaxGallery';
import StackGallery from './StackGallery';
import Marquee from './Marquee';
import { images } from '../data/images';

const MixedGallery: React.FC = () => {
    // Split images into 3 chunks of 8
    // Split images based on orientation requests
    const splitImages = useMemo(() => {
        // Filter specifically for Stack (verticals only) & Parallax (horizontals only)
        // @ts-ignore
        const portraits = images.filter(img => img.orientation === 'portrait');
        // @ts-ignore
        const landscapes = images.filter(img => img.orientation !== 'portrait');

        // Phase 3 (Stack): Strictly Portraits (First 8)
        const stackItems = portraits.slice(0, 8);
        const remainingPortraits = portraits.slice(8);

        // Phase 2 (Parallax): Landscapes
        // User wants ID 24 "Konica Impresa" specifically to fill "bottom left".
        // In strictly alternating columns (L, R, L, R...), index 8 would be Left (0, 2, 4, 6, 8).
        // So we want to ensure ID 24 is the 9th item (index 8).

        // Find ID 24
        // @ts-ignore
        const specificImg = images.find(img => img.id === 24);

        // Remove ID 24 from general pool so we don't duplicate
        const landscapesWithoutSpecific = landscapes.filter(img => img.id !== 24);

        // Take 8 other landscapes
        const baseParallax = landscapesWithoutSpecific.slice(0, 8);

        // Combine: 8 others + ID 24 at the end = 9 items. 
        // Index 8 (9th item) will go to Left Column.
        const parallaxItems = specificImg ? [...baseParallax, specificImg] : baseParallax;

        const remainingLandscapes = landscapesWithoutSpecific.slice(8);

        // Phase 1 (Horizon): The leftovers (Mixed)
        const pool = [...remainingLandscapes, ...remainingPortraits];

        // Seeded Shuffle for consistency
        let seed = 532;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // Section 1 gets the mixed remainder
        const section1 = pool;

        return { section1, section2: parallaxItems, section3: stackItems };
    }, []);

    const { section1, section2, section3 } = splitImages;

    return (
        <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Phase 1: Horizontal Scroll */}
            <HorizontalGallery items={section1} title="The<br/>Collection" subtitle="Phase I — Horizon" />

            {/* Transition */}
            <Marquee text="Perspective Shift • Verticality • Gravity • " direction="right" speed={20} />

            {/* Phase 2: Vertical Parallax */}
            <div style={{ background: 'transparent' }}>
                <div style={{ padding: '10vh 0', textAlign: 'center' }}>
                    <h2>Phase II — Chaos</h2>
                    <p>Order in disorder</p>
                </div>
                <ParallaxGallery items={section2} />
            </div>

            {/* Transition */}
            <Marquee text="Depth • Immersion • Focus • " direction="left" speed={20} />

            {/* Phase 3: Stack / Deep Dive */}
            <StackGallery items={section3} />
        </div>
    );
};

export default MixedGallery;
