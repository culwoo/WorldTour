import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { GalleryItemState } from '../../store/useGalleryStore';
import { getScrollVelocity } from '../../utils/scrollTracker';
import './Materials';

// Fewer geometry segments on low-power devices — still smooth enough for the
// scroll-warp, a fraction of the vertices.
const IS_MOBILE = typeof window !== 'undefined'
    && window.matchMedia('(max-width: 768px)').matches;
const SEGMENTS = IS_MOBILE ? 6 : 16;

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

    window.addEventListener('pointermove', onPointerMove, { passive: true, capture: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
    window.addEventListener('pointerup', cancelPointer, { passive: true, capture: true });
    window.addEventListener('pointercancel', cancelPointer, { passive: true, capture: true });

    // Fallbacks
    window.addEventListener('mousedown', onPointerDown as EventListener, { passive: true, capture: true });
    window.addEventListener('mouseup', cancelPointer, { passive: true, capture: true });

    pointerListenerAttached = true;
};

type InjectedShader = { uniforms: Record<string, THREE.IUniform> };

interface Props {
    item: GalleryItemState;
    /** Hidden while this photo is expanded in the DOM lightbox (avoids ghosting). */
    hidden?: boolean;
}

const GalleryPlane: React.FC<Props> = ({ item, hidden = false }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const offsetRef = useRef({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0 });
    const gravityRef = useRef(0);
    const opacityRef = useRef(1);
    const shaderRef = useRef<InjectedShader | null>(null);
    const { size, gl } = useThree();

    useEffect(() => {
        initPointerListener();
    }, []);

    // Full-resolution original so the resting gallery is exactly as sharp as
    // the source photo. Max anisotropy keeps it crisp at oblique warp angles.
    const texture = useTexture(item.url);
    useMemo(() => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        texture.needsUpdate = true;
    }, [texture, gl]);

    // MeshBasicMaterial keeps three's exact color management; onBeforeCompile
    // injects the scroll-warp (vertex) and velocity-driven RGB split (fragment)
    // straight into the built-in program so colors never shift.
    const material = useMemo(() => {
        const m = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
        });
        m.onBeforeCompile = (shader) => {
            shader.uniforms.uVelocity = { value: 0 };
            shader.uniforms.uTime = { value: 0 };

            shader.vertexShader =
                'uniform float uVelocity;\nuniform float uTime;\n' +
                shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `#include <begin_vertex>
                    float v = uVelocity;
                    // Page-flap bend: edges lead, driven by scroll velocity.
                    transformed.z += position.y * v * 120.0;
                    // Fine ripple travelling across the surface while moving.
                    transformed.z += sin(position.x * 3.14159 + uTime * 0.6) * 7.0 * abs(v);
                    // Subtle shear so the whole card leans into the motion.
                    transformed.x += sin(position.y * 3.14159) * v * 0.03;`,
                );

            shader.fragmentShader =
                'uniform float uVelocity;\n' +
                shader.fragmentShader.replace(
                    '#include <map_fragment>',
                    `#ifdef USE_MAP
                    float s = uVelocity * 0.012;
                    vec4 sampledDiffuseColor = texture2D( map, vMapUv );
                    sampledDiffuseColor.r = texture2D( map, vMapUv + vec2(s, 0.0) ).r;
                    sampledDiffuseColor.b = texture2D( map, vMapUv - vec2(s, 0.0) ).b;
                    diffuseColor *= sampledDiffuseColor;
                    #endif`,
                );

            shaderRef.current = shader as unknown as InjectedShader;
        };
        return m;
    }, [texture]);

    useEffect(() => () => material.dispose(), [material]);

    useFrame((state, delta) => {
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
        const isMouseDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

        if (isMouseDevice || grav > 0.01) {
            const screenCenterX = left + width / 2;
            const screenCenterY = top + height / 2;

            const dx = globalPointer.x - screenCenterX;
            const dy = globalPointer.y - screenCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const maxDimension = Math.max(width, height);
            const hoverRadius = maxDimension * 0.6;

            const baseMagneticRadius = maxDimension * 1.2;
            const magneticRadius = baseMagneticRadius + (Math.max(window.innerWidth, window.innerHeight) * 2) * grav;

            if (dist < magneticRadius) {
                const pullPower = 1 - Math.min(dist / magneticRadius, 1);
                const smoothCurve = THREE.MathUtils.lerp(2, 0.8, grav);
                const smoothPull = Math.pow(pullPower, smoothCurve);

                const normalPullX = (dx / magneticRadius) * (width * 0.04) * smoothPull;
                const normalPullY = -(dy / magneticRadius) * (height * 0.04) * smoothPull;

                const jitterX = Math.sin(item.id * 123.4) * width * 0.3;
                const jitterY = Math.cos(item.id * 567.8) * height * 0.3;
                const blackholePullX = (dx - jitterX) * 0.85 * smoothPull;
                const blackholePullY = -(dy - jitterY) * 0.85 * smoothPull;

                targetOffsetX = THREE.MathUtils.lerp(normalPullX, blackholePullX, grav);
                targetOffsetY = THREE.MathUtils.lerp(normalPullY, blackholePullY, grav);
                const uniqueZLayer = item.id * 2;
                targetOffsetZ = THREE.MathUtils.lerp(0, 150 + uniqueZLayer, grav) * smoothPull;

                if (dist < hoverRadius || grav > 0) {
                    const effectiveHoverRadius = hoverRadius + (magneticRadius - hoverRadius) * grav;
                    const tiltPower = 1 - Math.min(dist / effectiveHoverRadius, 1);
                    const smoothTilt = Math.pow(tiltPower, 1.5);

                    const normalRotX = Math.PI / 25;
                    const normalRotY = Math.PI / 25;
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

        // 7. Fade out while expanded in the lightbox
        const targetOpacity = hidden ? 0 : 1;
        opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, Math.min(1, delta * 12));
        material.opacity = opacityRef.current;
        meshRef.current.visible = opacityRef.current > 0.01;

        // 8. Feed the scroll-warp shader (damped a touch here for silkiness)
        if (shaderRef.current) {
            const v = getScrollVelocity();
            const u = shaderRef.current.uniforms;
            u.uVelocity.value = THREE.MathUtils.lerp(u.uVelocity.value as number, v, Math.min(1, delta * 8));
            u.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <mesh ref={meshRef} material={material} renderOrder={item.id}>
            <planeGeometry args={[1, 1, SEGMENTS, SEGMENTS]} />
        </mesh>
    );
};

export default GalleryPlane;
