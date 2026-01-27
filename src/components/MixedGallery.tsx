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
        // 1. Separate by orientation
        // @ts-ignore
        const portraits = images.filter(img => img.orientation === 'portrait');
        // @ts-ignore
        const landscapes = images.filter(img => img.orientation !== 'portrait');

        // 2. Shuffle utilities
        let seed = 532;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
        const shuffle = (array: any[]) => {
            const pool = [...array];
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            return pool;
        };

        // 3. Process Portraits (For Phase 1 & 3)
        const shuffledPortraits = shuffle(portraits);
        const halfPoint = Math.ceil(shuffledPortraits.length / 2);

        const section1 = shuffledPortraits.slice(0, halfPoint); // Phase 1: Portraits
        const section3 = shuffledPortraits.slice(halfPoint);    // Phase 3: Portraits

        // 4. Process Landscapes (For Phase 2)
        // We put ALL landscapes in Phase 2.
        // Optional: Ensure specific ID 24 logic if desired, but user said "Use strictly landscapes".
        // Let's just shuffle them to mix them up.
        const section2 = shuffle(landscapes);

        return { section1, section2, section3 };
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
