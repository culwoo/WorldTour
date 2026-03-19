import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { GalleryItemState } from '../../store/useGalleryStore';
import './Materials';

// Global pointer and long-press tracking
const globalPointer = new THREE.Vector2(-9999, -9999);
let pointerListenerAttached = false;
let isLongPress = false;
let pointerDownTimer: ReturnType<typeof setTimeout> | null = null;

const initPointerListener = () => {
    if (pointerListenerAttached || typeof window === 'undefined') return;
    
    const onPointerMove = (e: PointerEvent) => {
        globalPointer.x = e.clientX;
        globalPointer.y = e.clientY;
    };

    const onPointerDown = (e: PointerEvent) => {
        globalPointer.x = e.clientX;
        globalPointer.y = e.clientY;

        if (pointerDownTimer) clearTimeout(pointerDownTimer);
        
        // Activate "Gravity Gather" after 250ms of holding
        pointerDownTimer = setTimeout(() => {
            isLongPress = true;
        }, 250);
    };

    const cancelPointer = () => {
        isLongPress = false;
        if (pointerDownTimer) {
            clearTimeout(pointerDownTimer);
            pointerDownTimer = null;
        }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', cancelPointer, { passive: true });
    window.addEventListener('pointercancel', cancelPointer, { passive: true });
    
    pointerListenerAttached = true;
};

interface Props {
    item: GalleryItemState;
}

const GalleryPlane: React.FC<Props> = ({ item }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const offsetRef = useRef({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0 });
    const gravityRef = useRef(0);
    const { size } = useThree();

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

        // 2. Blackhole Gravity Multiplier Interpolation
        const targetGravity = isLongPress ? 1 : 0;
        const gravityLerp = 1 - Math.pow(0.0001, delta);
        gravityRef.current = THREE.MathUtils.lerp(gravityRef.current, targetGravity, gravityLerp);
        const grav = gravityRef.current;

        // 3. Hover & Gravity Physics
        // On mobile, if grav=0, hover disabled. On desktop, hover always active.
        // We use Math.max to ensure hover works on desktop but isn't weirdly stuck on mobile if not pressed.
        // Actually, matching fine pointer is safer for base hover, but let's just use grav to enable mobile pull.
        const isMouseDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
        
        if (isMouseDevice || grav > 0.01) {
            const screenCenterX = left + width / 2;
            const screenCenterY = top + height / 2;

            const dx = globalPointer.x - screenCenterX;
            const dy = globalPointer.y - screenCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const maxDimension = Math.max(width, height);
            const hoverRadius = maxDimension * 0.6; 
            
            // Expand magnetic radius drastically when gravity is active
            const baseMagneticRadius = maxDimension * 1.2;
            const magneticRadius = baseMagneticRadius + (Math.max(window.innerWidth, window.innerHeight) * 2) * grav;

            if (dist < magneticRadius) {
                // Determine pulling strength
                const pullPower = 1 - Math.min(dist / magneticRadius, 1);
                // Reduce the "curve" of gravity so distant objects pull harder when grav is near 1
                const smoothCurve = THREE.MathUtils.lerp(2, 0.8, grav); 
                const smoothPull = Math.pow(pullPower, smoothCurve); 
                
                // Normal subtle hover pull
                const normalPullX = (dx / magneticRadius) * (width * 0.04) * smoothPull;
                const normalPullY = -(dy / magneticRadius) * (height * 0.04) * smoothPull;
                
                // Blackhole intense pull (pulls extremely close to cursor center)
                // Add a bit of jitter based on item.id so they don't perfectly overlap
                const jitterX = Math.sin(item.id * 123.4) * width * 0.3;
                const jitterY = Math.cos(item.id * 567.8) * height * 0.3;
                const blackholePullX = (dx - jitterX) * 0.85 * smoothPull;
                const blackholePullY = -(dy - jitterY) * 0.85 * smoothPull;

                targetOffsetX = THREE.MathUtils.lerp(normalPullX, blackholePullX, grav);
                targetOffsetY = THREE.MathUtils.lerp(normalPullY, blackholePullY, grav);
                targetOffsetZ = THREE.MathUtils.lerp(0, 150 + dist * 0.1, grav) * smoothPull;

                // Tilt Physics
                if (dist < hoverRadius || grav > 0) {
                    const effectiveHoverRadius = hoverRadius + (magneticRadius - hoverRadius) * grav;
                    const tiltPower = 1 - Math.min(dist / effectiveHoverRadius, 1);
                    const smoothTilt = Math.pow(tiltPower, 1.5);
                    
                    const normalRotX = Math.PI / 25;
                    const normalRotY = Math.PI / 25;
                    
                    // Slightly wilder rotations during blackhole pull
                    const blackholeRotX = Math.PI / 6;
                    const blackholeRotY = Math.PI / 6;

                    const effectiveRotX = THREE.MathUtils.lerp(normalRotX, blackholeRotX, grav);
                    const effectiveRotY = THREE.MathUtils.lerp(normalRotY, blackholeRotY, grav);

                    targetRotY = (dx / effectiveHoverRadius) * effectiveRotY * smoothTilt; 
                    targetRotX = (dy / effectiveHoverRadius) * effectiveRotX * smoothTilt;

                    if (grav < 0.01) {
                        targetOffsetZ += 25 * smoothTilt;
                    }
                }
            }
        }

        // 4. Interpolate ONLY the offsets
        const lerpFactorPos = Math.min(1, 1 - Math.pow(0.001, delta)); 
        const lerpFactorRot = Math.min(1, 1 - Math.pow(0.0001, delta)); 

        const offsets = offsetRef.current;
        offsets.x = THREE.MathUtils.lerp(offsets.x, targetOffsetX, lerpFactorPos);
        offsets.y = THREE.MathUtils.lerp(offsets.y, targetOffsetY, lerpFactorPos);
        offsets.z = THREE.MathUtils.lerp(offsets.z, targetOffsetZ, lerpFactorPos);
        offsets.rotX = THREE.MathUtils.lerp(offsets.rotX, targetRotX, lerpFactorRot);
        offsets.rotY = THREE.MathUtils.lerp(offsets.rotY, targetRotY, lerpFactorRot);

        // 5. Combine perfect DOM sync with smooth physics offsets
        meshRef.current.position.set(baseX + offsets.x, baseY + offsets.y, baseZ + offsets.z);
        meshRef.current.rotation.set(offsets.rotX, offsets.rotY, 0);

        // 6. Update Scale to match DOM exactly
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
