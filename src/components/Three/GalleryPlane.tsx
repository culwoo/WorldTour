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
    const offsetRef = useRef({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0 });
    const { size } = useThree();

    // Initialize global pointer listener on mount
    useEffect(() => {
        initPointerListener();
    }, []);

    const texture = useTexture(item.url);

    useFrame((_, delta) => {
        if (!item.ref || !meshRef.current) return;

        const { width, height, top, left } = item.ref.getBoundingClientRect();

        // 1. Precise DOM scroll sync (no lerping this!)
        const baseX = left - size.width / 2 + width / 2;
        const baseY = -top + size.height / 2 - height / 2;
        const baseZ = (item.zIndex || item.id * 0.001) * 0.1;

        let targetOffsetX = 0;
        let targetOffsetY = 0;
        let targetOffsetZ = 0;
        let targetRotX = 0;
        let targetRotY = 0;

        // 2. Hover Physics (Magnetic Parallax via offsets)
        if (isHoverPhysicsEnabled) {
            const screenCenterX = left + width / 2;
            const screenCenterY = top + height / 2;

            const dx = globalPointer.x - screenCenterX;
            const dy = globalPointer.y - screenCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Calculate Radiuses
            const maxDimension = Math.max(width, height);
            const hoverRadius = maxDimension * 0.6; 
            const magneticRadius = maxDimension * 1.2;

            if (dist < magneticRadius) {
                // A. Magnetic Pull
                const pullPower = 1 - Math.min(dist / magneticRadius, 1);
                const smoothPull = Math.pow(pullPower, 2); 
                
                const maxPullX = width * 0.04;
                const maxPullY = height * 0.04;
                
                targetOffsetX = (dx / magneticRadius) * maxPullX * smoothPull;
                targetOffsetY = -(dy / magneticRadius) * maxPullY * smoothPull;

                // B. Hover Tilt & Depth
                if (dist < hoverRadius) {
                    const tiltPower = 1 - Math.min(dist / hoverRadius, 1);
                    const smoothTilt = Math.pow(tiltPower, 1.5);
                    
                    const maxRotX = Math.PI / 25; // Much softer, minimal rotation setup
                    const maxRotY = Math.PI / 25;

                    targetRotY = (dx / hoverRadius) * maxRotY * smoothTilt; 
                    targetRotX = (dy / hoverRadius) * maxRotX * smoothTilt;

                    // Depth pop-out
                    targetOffsetZ = 25 * smoothTilt;
                }
            }
        }

        // 3. Interpolate ONLY the offsets
        const lerpFactorPos = Math.min(1, 1 - Math.pow(0.001, delta)); 
        const lerpFactorRot = Math.min(1, 1 - Math.pow(0.0001, delta)); 

        const offsets = offsetRef.current;
        offsets.x = THREE.MathUtils.lerp(offsets.x, targetOffsetX, lerpFactorPos);
        offsets.y = THREE.MathUtils.lerp(offsets.y, targetOffsetY, lerpFactorPos);
        offsets.z = THREE.MathUtils.lerp(offsets.z, targetOffsetZ, lerpFactorPos);
        offsets.rotX = THREE.MathUtils.lerp(offsets.rotX, targetRotX, lerpFactorRot);
        offsets.rotY = THREE.MathUtils.lerp(offsets.rotY, targetRotY, lerpFactorRot);

        // 4. Combine perfect DOM sync with smooth physics offsets
        meshRef.current.position.set(baseX + offsets.x, baseY + offsets.y, baseZ + offsets.z);
        meshRef.current.rotation.set(offsets.rotX, offsets.rotY, 0);

        // 5. Update Scale to match DOM exactly
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
