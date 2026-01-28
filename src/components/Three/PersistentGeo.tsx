import React, { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PersistentGeo: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<any>(null);

    useLayoutEffect(() => {
        // We need to wait for DOM to be ready? It usually is by mount.

        // Define a timeline tied to the whole page scroll
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5 // Smooth catch up
            }
        });

        if (meshRef.current) {
            // Initial State Hero: Center, Large

            // Phase 1: Scroll down from Hero -> Move to top right, shrink
            tl.to(meshRef.current.position, {
                x: 4,
                y: 2,
                z: -400,
                duration: 2 // relative unit
            });
            tl.to(meshRef.current.scale, {
                x: 0.5, y: 0.5, z: 0.5,
                duration: 2
            }, "<"); // sync

            // Phase 2: During Horizontal Scroll (middle of page) -> Move to Left
            tl.to(meshRef.current.position, {
                x: -4,
                y: -1,
                duration: 5
            });

            // Phase 3: Footer -> Center and Explode/Expand
            tl.to(meshRef.current.position, {
                x: 0,
                y: 0,
                z: -200,
                duration: 2
            });
            tl.to(meshRef.current.scale, {
                x: 0.2, y: 0.2, z: 0.2,
                duration: 2
            }, "<");
        }

        return () => {
            tl.kill();
            // ScrollTrigger.getAll().forEach(t => t.kill()); // Be careful killing global triggers
        };
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        // Constant gentle rotation
        meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;

        // Distort animation
        if (materialRef.current) {
            materialRef.current.distort = 0.4 + Math.sin(state.clock.getElapsedTime()) * 0.1;
        }
    });

    return (
        <Sphere ref={meshRef} args={[1, 64, 64]} position={[0, 0, -400]} scale={2.5}>
            <MeshDistortMaterial
                ref={materialRef}
                color="#ffffff" // White glass feeling?
                attach="material"
                distort={0.4}
                speed={2}
                roughness={0.2}
                metalness={0.9}
                wireframe={true} // Wireframe looks tech/cool
            />
        </Sphere>
    );
};

export default PersistentGeo;
