import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { GalleryItemState } from '../../store/useGalleryStore';
import './Materials';

// Global pointer tracking to avoid attaching event listeners per plane
const globalPointer = new THREE.Vector2(-9999, -9999);
let isHoverPhysicsEnabled = false;
let pointerListenerAttached = false;

const initPointerListener = () => {
    if (pointerListenerAttached || typeof window === 'undefined') return;
    
    // Only enable hover physics on devices with a fine pointer (mouse)
    isHoverPhysicsEnabled = window.matchMedia('(pointer: fine)').matches;
    
    if (isHoverPhysicsEnabled) {
        window.addEventListener('mousemove', (e) => {
            globalPointer.x = e.clientX;
            globalPointer.y = e.clientY;
        }, { passive: true });
    }
    pointerListenerAttached = true;
};

interface Props {
    item: GalleryItemState;
}

const GalleryPlane: React.FC<Props> = ({ item }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { size } = useThree();

    // Initialize global pointer listener on mount
    useEffect(() => {
        initPointerListener();
    }, []);

    const texture = useTexture(item.url);

    useFrame((_, delta) => {
        if (!item.ref || !meshRef.current) return;

        const { width, height, top, left } = item.ref.getBoundingClientRect();

        // 1. Base Positions from scroll
        const baseX = left - size.width / 2 + width / 2;
        const baseY = -top + size.height / 2 - height / 2;

        const zPriority = item.zIndex || item.id * 0.001;
        const baseZ = zPriority * 0.1;

        let targetX = baseX;
        let targetY = baseY;
        let targetZ = baseZ;
        let targetRotX = 0;
        let targetRotY = 0;

        // 2. Hover Physics (Magnetic Parallax)
        if (isHoverPhysicsEnabled) {
            const screenCenterX = left + width / 2;
            const screenCenterY = top + height / 2;

            const dx = globalPointer.x - screenCenterX;
            const dy = globalPointer.y - screenCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Calculate Radiuses
            const maxDimension = Math.max(width, height);
            const hoverRadius = maxDimension * 0.7; 
            const magneticRadius = maxDimension * 1.5;

            if (dist < magneticRadius) {
                // A. Magnetic Pull
                const pullPower = 1 - Math.min(dist / magneticRadius, 1);
                const smoothPull = Math.pow(pullPower, 2); 
                
                const maxPullX = width * 0.1;
                const maxPullY = height * 0.1;
                
                targetX += (dx / magneticRadius) * maxPullX * smoothPull;
                targetY -= (dy / magneticRadius) * maxPullY * smoothPull; // Invert dy for WebGL Y

                // B. Hover Tilt & Depth
                if (dist < hoverRadius) {
                    const tiltPower = 1 - Math.min(dist / hoverRadius, 1);
                    const smoothTilt = Math.pow(tiltPower, 1.5);
                    
                    const maxRotX = Math.PI / 10; // ~18 degrees max
                    const maxRotY = Math.PI / 10;

                    // Calculate rotation based on local normalized pos (-1 to 1) 
                    // Use hoverRadius as the denominator to make transition smooth
                    targetRotY = (dx / hoverRadius) * maxRotY * smoothTilt; 
                    targetRotX = (dy / hoverRadius) * maxRotX * smoothTilt;

                    // Depth pop-out
                    targetZ += 40 * smoothTilt;
                }
            }
        }

        // 3. Apply Smooth Interpolation (Lerp)
        // Adjust lerp speed by delta so it's frame-rate independent
        const lerpFactorPos = 1 - Math.pow(0.001, delta); 
        const lerpFactorRot = 1 - Math.pow(0.0001, delta); // Slightly slower rotation for weight

        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, lerpFactorPos);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, lerpFactorPos);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, lerpFactorPos);

        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, lerpFactorRot);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, lerpFactorRot);

        // 4. Update Scale to match DOM exactly
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
