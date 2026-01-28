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

const FloatingImage: React.FC<FloatingImageProps> = (props) => {
    const texture = useTexture(props.url);

    // texture.image might be undefined initially or typed as generic HTMLImageElement | HTMLCanvasElement...
    // We cast to any to safely access width/height properties without strict TS checks for this visual effect.
    const img = texture.image as any;
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

        meshRef.current.position.x = props.initialPos[0];
        meshRef.current.position.y = props.initialPos[1] + bobble + parallaxY;
        meshRef.current.position.z = props.initialPos[2];
        meshRef.current.rotation.z = rotation;
    });

    return (
        <mesh ref={meshRef} position={props.initialPos} scale={[width, height, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture} transparent opacity={0.6} depthWrite={false} />
        </mesh>
    );
}

const FloatingHeroImages: React.FC = () => {
    const { width, height } = useThree(state => state.size);

    // Create a stable set of floating items
    const floatingItems = useMemo(() => {
        const isMobile = typeof window !== 'undefined'
            && window.matchMedia('(max-width: 768px)').matches;
        const count = isMobile ? 4 : 6;
        const selectedImages = images.slice(0, count);

        return selectedImages.map((img) => {
            // Random spread based on viewport size
            const x = (Math.random() - 0.5) * width * 1.2;
            const y = (Math.random() - 0.5) * height * 0.8;
            const z = -200 + Math.random() * 400;

            const baseScale = isMobile ? 120 : 150;
            const scaleVariance = isMobile ? 120 : 150;
            const scale = baseScale + Math.random() * scaleVariance;

            return {
                id: img.id,
                url: img.url,
                initialPos: [x, y, z] as [number, number, number],
                scale,
                timeOffset: Math.random() * 100,
                speed: 0.5 + Math.random() * 1.5,
                parallaxSpeed: 0.5 + Math.random() * 0.5
            };
        });
    }, [width, height]);

    return (
        <group>
            {floatingItems.map((item) => (
                <FloatingImage key={item.id} {...item} />
            ))}
        </group>
    );
};

export default FloatingHeroImages;
