import React, { useMemo } from 'react';
import HorizontalGallery from './HorizontalGallery';
import ParallaxGallery from './ParallaxGallery';
import Marquee from './Marquee';
import { images } from '../data/images';

const MixedGallery: React.FC = () => {
    // Initialize with correct value to avoid flash
    const [isMobile, setIsMobile] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(max-width: 768px)').matches;
        }
        return false;
    });

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };

        // Initial check
        checkMobile();

        // Listener
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const useWebGL = !isMobile;

    // Split images into 2 chunks (Phase 1 & 2 only)
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

        // 3. Process Portraits (ALL for Phase 1)
        const section1 = shuffle(portraits);

        // 4. Process Landscapes (ALL for Phase 2)
        const section2 = shuffle(landscapes);

        return { section1, section2 };
    }, []);

    const { section1, section2 } = splitImages;

    return (
        <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Phase 1: Horizontal Scroll (All Portraits) */}
            <HorizontalGallery items={section1} title="The<br/>Collection" subtitle="Phase I" useWebGL={useWebGL} />

            {/* Transition */}
            <Marquee text="LifeOfKwak • " direction="right" speed={20} />

            {/* Phase 2: Vertical Parallax (All Landscapes) */}
            <div style={{ background: 'transparent', paddingBottom: '10vh' }}>
                <div style={{ padding: '10vh 0', textAlign: 'center' }}>
                    <h2>Phase II</h2>
                </div>
                <ParallaxGallery items={section2} useWebGL={useWebGL} />
            </div>

            {/* No Phase 3 - Removed as per request */}
        </div>
    );
};

export default MixedGallery;
