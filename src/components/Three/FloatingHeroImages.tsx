import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { images } from '../../data/images';

interface FloatingImageProps {
    url: string;
    initialPos: [number, number, number];
    scale: number;
    timeOffset: number;
    speed: number;
    parallaxSpeed: number;
}

const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
};

const FloatingImage: React.FC<FloatingImageProps> = (props) => {
    const texture = useTexture(props.url);

    const img = texture.image as { width?: number; height?: number } | undefined;
    const aspect = (img && img.width && img.height) ? (img.width / img.height) : 1;

    // Adjusted scale. We treat props.scale as width.
    const width = props.scale;
    const height = props.scale / aspect;

    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const scrollY = window.scrollY;

        // Bobbing animation: continuous sine wave vertical movement
        const bobble = Math.sin(time * props.speed + props.timeOffset) * 20;

        // Gentle rotation for a "floating" feel
        const rotation = Math.sin(time * props.speed * 0.3 + props.timeOffset) * 0.1;

        // Parallax effect: Moves images UP as user scrolls DOWN
        const parallaxY = scrollY * props.parallaxSpeed;

        meshRef.current.position.y = props.initialPos[1] + bobble + parallaxY;
        meshRef.current.position.z = props.initialPos[2];
        meshRef.current.rotation.z = rotation;

        // Fade in logic
        if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
            meshRef.current.material.opacity = THREE.MathUtils.lerp(meshRef.current.material.opacity, 0.6, 0.05);
        }
    });

    return (
        <mesh ref={meshRef} position={props.initialPos} scale={[width, height, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture} transparent opacity={0} depthWrite={false} />
        </mesh>
    );
}

const FloatingHeroImages: React.FC = () => {
    const { width, height } = useThree(state => state.size);

    // Create deterministic floating items to keep render output pure.
    const floatingItems = useMemo(() => {
        const isMobile = typeof window !== 'undefined'
            && window.matchMedia('(max-width: 768px)').matches;
        const count = isMobile ? 4 : 6;
        const selectedImages = images.slice(0, count);

        return selectedImages.map((img, index) => {
            const seed = img.id * 97 + index * 31;
            const x = (pseudoRandom(seed + 1) - 0.5) * width * 1.2;
            const y = (pseudoRandom(seed + 2) - 0.5) * height * 0.8;
            const z = -200 + pseudoRandom(seed + 3) * 400;

            const baseScale = isMobile ? 120 : 150;
            const scaleVariance = isMobile ? 120 : 150;
            const scale = baseScale + pseudoRandom(seed + 4) * scaleVariance;

            return {
                id: img.id,
                url: img.url,
                initialPos: [x, y, z] as [number, number, number],
                scale,
                timeOffset: pseudoRandom(seed + 5) * 100,
                speed: 0.5 + pseudoRandom(seed + 6) * 1.5,
                parallaxSpeed: 0.5 + pseudoRandom(seed + 7) * 0.5
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
