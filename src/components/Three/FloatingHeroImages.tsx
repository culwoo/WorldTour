import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { images } from '../../data/images';
import { ringTextureUrl } from '../../data/imageMeta';

// Normalised pointer (-1..1), shared by every hero image for parallax.
const heroPointer = { x: 0, y: 0 };
let heroPointerAttached = false;
const attachHeroPointer = () => {
    if (heroPointerAttached || typeof window === 'undefined') return;
    heroPointerAttached = true;
    window.addEventListener(
        'pointermove',
        (e) => {
            heroPointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            heroPointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        },
        { passive: true },
    );
};

interface FloatingImageProps {
    url: string;
    initialPos: [number, number, number];
    scale: number;
    timeOffset: number;
    speed: number;
    parallaxSpeed: number;
    depth: number; // 0 (far) .. 1 (near) — drives parallax strength + entrance order
    index: number;
}

const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
};

const FloatingImage: React.FC<FloatingImageProps> = (props) => {
    const texture = useTexture(ringTextureUrl(props.url));

    const img = texture.image as { width?: number; height?: number } | undefined;
    const aspect = img && img.width && img.height ? img.width / img.height : 1;

    const width = props.scale;
    const height = props.scale / aspect;

    const meshRef = useRef<THREE.Mesh>(null);
    const born = useRef(0);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const scrollY = window.scrollY;

        // Staggered cinematic entrance: each image "develops" in, near ones last.
        born.current = Math.min(1, born.current + delta / 1.2);
        const startAt = props.index * 0.12;
        const reveal = THREE.MathUtils.clamp((time - startAt) / 1.1, 0, 1);
        const ease = 1 - Math.pow(1 - reveal, 3);

        // Floating bob + gentle sway
        const bob = Math.sin(time * props.speed + props.timeOffset) * 18;
        const sway = Math.cos(time * props.speed * 0.7 + props.timeOffset) * 10;
        const rot = Math.sin(time * props.speed * 0.3 + props.timeOffset) * 0.08;

        // Parallax: nearer images react more to pointer, and drift up on scroll.
        const par = 40 + props.depth * 120;
        const targetX = props.initialPos[0] + sway - heroPointer.x * par;
        const targetY = props.initialPos[1] + bob + heroPointer.y * par * 0.6 + scrollY * props.parallaxSpeed;

        const m = meshRef.current;
        m.position.x = THREE.MathUtils.damp(m.position.x, targetX, 4, delta);
        m.position.y = THREE.MathUtils.damp(m.position.y, targetY, 4, delta);
        m.position.z = props.initialPos[2];
        m.rotation.z = rot;

        // Fade + scale-in, then fade out as the hero scrolls away.
        const scrollFade = THREE.MathUtils.clamp(1 - scrollY / (window.innerHeight * 0.9), 0, 1);
        const targetOpacity = 0.62 * ease * scrollFade;
        const s = (0.82 + 0.18 * ease) ;
        m.scale.set(width * s, height * s, 1);
        if (m.material instanceof THREE.MeshBasicMaterial) {
            m.material.opacity = THREE.MathUtils.lerp(m.material.opacity, targetOpacity, 0.12);
        }
    });

    return (
        <mesh ref={meshRef} position={props.initialPos} scale={[width, height, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture} transparent opacity={0} depthWrite={false} />
        </mesh>
    );
};

const FloatingHeroImages: React.FC = () => {
    const { width, height } = useThree((state) => state.size);

    useEffect(() => {
        attachHeroPointer();
    }, []);

    const floatingItems = useMemo(() => {
        const isMobile =
            typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
        const count = isMobile ? 5 : 8;
        const selectedImages = images.slice(0, count);

        return selectedImages.map((img, index) => {
            const seed = img.id * 97 + index * 31;

            // Spread wider than the viewport and across a deep z-range so the
            // cluster reads as a volume you could fly through.
            const x = (pseudoRandom(seed + 1) - 0.5) * width * 1.5;
            const y = (pseudoRandom(seed + 2) - 0.5) * height * 0.95;
            const z = -600 + pseudoRandom(seed + 3) * 850; // -600 .. +250
            const depth = THREE.MathUtils.clamp((z + 600) / 850, 0, 1);

            // Nearer images are larger; farther ones recede.
            const baseScale = (isMobile ? 130 : 175) * (0.7 + depth * 0.9);
            const scale = baseScale + pseudoRandom(seed + 4) * (isMobile ? 60 : 90);

            return {
                id: img.id,
                url: img.url,
                initialPos: [x, y, z] as [number, number, number],
                scale,
                depth,
                index,
                timeOffset: pseudoRandom(seed + 5) * 100,
                speed: 0.4 + pseudoRandom(seed + 6) * 1.2,
                parallaxSpeed: 0.35 + depth * 0.45,
            };
        });
    }, [height, width]);

    return (
        <group>
            {floatingItems.map((item) => (
                <FloatingImage key={item.id} {...item} />
            ))}
        </group>
    );
};

export default FloatingHeroImages;
