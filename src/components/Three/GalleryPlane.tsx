import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { GalleryItemState } from '../../store/useGalleryStore';
import './Materials'; // Ensure side-effect runs to register materials
// import gsap from 'gsap'; // We don't have gsap installed, use lerp manually.

interface Props {
    item: GalleryItemState;
}

const GalleryPlane: React.FC<Props> = ({ item }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { size } = useThree();

    // Load texture directly. 
    // Note: useTexture suspends, so this component needs to be wrapped in Suspense (which Canvas usually provides or we have one up top)
    const texture = useTexture(item.url);

    useFrame(() => {
        if (!item.ref || !meshRef.current) return;

        const { width, height, top, left } = item.ref.getBoundingClientRect();

        const x = left - size.width / 2 + width / 2;
        const y = -top + size.height / 2 - height / 2;

        // Use explicit zIndex for ordering if provided, fallback to ID based to avoid fighting
        // We multiply by 0.1 to give enough separation
        const zPriority = item.zIndex || item.id * 0.001;
        const zOffset = zPriority * 0.1;

        meshRef.current.position.set(x, y, zOffset);

        // Strictly match the DOM size. 
        // Since DOM img has height:auto (natural ratio), this mesh will have natural ratio.
        // The texture will simply fill the quad (UV 0..1), so 1:1 mapping. Perfect aspect ratio.
        meshRef.current.scale.set(width, height, 1);
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture} transparent />
        </mesh>
    );
};

export default GalleryPlane;
