import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGalleryStore } from '../../store/useGalleryStore';
import GalleryPlane from './GalleryPlane';
import { Preload } from '@react-three/drei';

import FloatingHeroImages from './FloatingHeroImages';
import PersistentGeo from './PersistentGeo';

const SceneContent: React.FC = () => {
    const items = useGalleryStore((state) => state.items);
    return (
        <>
            <FloatingHeroImages />
            <PersistentGeo />
            {items.filter(item => item.useWebGL !== false).map((item) => (
                <GalleryPlane key={item.id} item={item} />
            ))}
            <Preload all />
        </>
    );
};

const Scene: React.FC = () => {
    return (
        <Canvas
            gl={{ alpha: true }}
            style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
            // Orthographic camera is easier for exact pixel match, but Perspective is nicer for 3D effects.
            // Let's stick to Perspective and calcluate FOV logic if needed.
            // Or simple solution: 1 unit = 1 pixel at z=0.
            camera={{ position: [0, 0, 600], fov: 75 }} // We'll adjust this manually purely for simplicity first?
        // Better: Use 'views' or just configure camera via `resize` handler, but R3F does auto-adjust.
        // To get 1px = 1 unit:
        // fov = 2 * atan( (window.innerHeight / 2) / 600 ) * (180 / PI)
        >
            <PerspectiveCameraHelper />
            <Suspense fallback={null}>
                <SceneContent />
            </Suspense>
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
