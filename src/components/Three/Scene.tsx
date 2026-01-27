import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGalleryStore } from '../../store/useGalleryStore';
import GalleryPlane from './GalleryPlane';
import { Preload } from '@react-three/drei';

import FloatingHeroImages from './FloatingHeroImages';
import PersistentGeo from './PersistentGeo';

interface SceneProps {
    ready: boolean;
}

const Scene: React.FC<SceneProps> = ({ ready }) => {
    const items = useGalleryStore((state) => state.items);

    return (
        <Canvas
            gl={{ alpha: true }}
            style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
            camera={{ position: [0, 0, 600], fov: 75 }}
        >
            <PerspectiveCameraHelper />

            {/* 1. Hero Images: Independent Suspense layer. 
                These are preloaded in Splash, so they should appear instantly. */}
            <Suspense fallback={null}>
                <FloatingHeroImages />
                <PersistentGeo />
            </Suspense>

            {/* 2. Main Gallery: Independent Suspense layer.
                Loaded only when 'ready' is true. 
                Because it's a separate Suspense sibling, its loading state 
                won't affect the visibility of Hero Images. */}
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

// Helper to set exact 1:1 pixel match
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

const PerspectiveCameraHelper = () => {
    const { camera, size } = useThree();

    useEffect(() => {
        const dist = 600;
        const height = size.height;
        // Calculate FOV
        // tan(fov/2 * PI/180) = (height/2) / dist
        // fov/2 * PI/180 = atan(height/2/dist)
        // fov = 2 * atan(height/2/dist) * 180 / PI

        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = 2 * Math.atan((height / 2) / dist) * (180 / Math.PI);
            camera.position.z = dist;
            camera.updateProjectionMatrix();
        }
    }, [size, camera]);

    return null;
}

import * as THREE from 'three';

export default Scene;
