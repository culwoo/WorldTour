import React, { Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGalleryStore } from '../../store/useGalleryStore';
import GalleryPlane from './GalleryPlane';
import { PerspectiveCamera, Preload } from '@react-three/drei';

import FloatingHeroImages from './FloatingHeroImages';

interface SceneProps {
    ready?: boolean;
}

const SceneCamera: React.FC = () => {
    const { size } = useThree();

    const fov = useMemo(() => {
        const dist = 600;
        return 2 * Math.atan((size.height / 2) / dist) * (180 / Math.PI);
    }, [size.height]);

    return <PerspectiveCamera makeDefault position={[0, 0, 600]} fov={fov} />;
};

const Scene: React.FC<SceneProps> = ({ ready = true }) => {
    const items = useGalleryStore((state) => state.items);
    // When a photo is expanded in the lightbox, fade its in-gallery plane out
    // so it doesn't ghost behind the FLIP animation as the backdrop fades in.
    const focusedId = useGalleryStore((state) => state.focusedId);

    // Clamp device-pixel-ratio lower on phones so the extra WebGL planes stay
    // buttery; desktops get the crisp upper bound.
    const isMobile = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
        [],
    );

    return (
        <Canvas
            // `flat` = NoToneMapping. Without it, R3F applies ACES Filmic tone
            // mapping which darkens/desaturates the photos vs the true original
            // (the DOM lightbox bypasses it, which is why click looked correct).
            // flat makes the WebGL gallery render the photo's exact source colors.
            flat
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                touchAction: 'none'
            }}
            dpr={isMobile ? [1, 1.25] : [1, 2]}
        >
            <SceneCamera />

            {/* Hero images — preloaded behind the splash so they appear instantly. */}
            <Suspense fallback={null}>
                <FloatingHeroImages />
            </Suspense>

            {/* Main gallery — loaded immediately behind the splash so shaders
                compile and textures upload while the user waits. */}
            {ready && (
                <Suspense fallback={null}>
                    {items.filter(item => item.useWebGL !== false).map((item) => (
                        <GalleryPlane key={item.id} item={item} hidden={focusedId === item.id} />
                    ))}
                </Suspense>
            )}

            <Preload all />
        </Canvas>
    );
};

export default Scene;
