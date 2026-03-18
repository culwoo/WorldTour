import React, { Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGalleryStore } from '../../store/useGalleryStore';
import GalleryPlane from './GalleryPlane';
import { PerspectiveCamera, Preload } from '@react-three/drei';

import FloatingHeroImages from './FloatingHeroImages';
import PersistentGeo from './PersistentGeo';

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

    return (
        <Canvas
            gl={{ alpha: true }}
            style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                touchAction: 'none'
            }}
            dpr={[1, 1.5]}
        >
            <SceneCamera />

            {/* 1. Hero Images: Independent Suspense layer. 
                These are preloaded in Splash, so they should appear instantly. */}
            <Suspense fallback={null}>
                <FloatingHeroImages />
                <PersistentGeo />
            </Suspense>

            {/* 2. Main Gallery: Independent Suspense layer.
                Now we load this IMMEDIATELY behind the splash screen.
                This allows shaders to compile and textures to upload while the user is waiting,
                preventing the freeze upon home screen entry. */}
            {ready && (
                <Suspense fallback={null}>
                    {items.filter(item => item.useWebGL !== false).map((item) => (
                        <GalleryPlane key={item.id} item={item} />
                    ))}
                </Suspense>
            )}

            <Preload all />
        </Canvas>
    );
};

export default Scene;
