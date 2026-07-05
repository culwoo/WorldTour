import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, useCursor } from '@react-three/drei';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// One shared unit quad for every card. Cards are just scaled instances of
// this geometry — zero per-card geometry cost, and the texture maps 1:1 onto
// a plane whose aspect ratio exactly matches the photo (no distortion).
// ---------------------------------------------------------------------------
const SHARED_QUAD = new THREE.PlaneGeometry(1, 1);

// ---------------------------------------------------------------------------
// Unlit card shader.
// - Rounded corners via an SDF mask with screen-space anti-aliasing
//   (crisp at any zoom level, unlike geometry-based rounding).
// - No lighting / tone mapping — the photo's colors are shown exactly.
// - Back faces un-mirror the image and dim slightly so the far side of the
//   ring reads as "the back of a print".
// ---------------------------------------------------------------------------
const VERTEX = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const FRAGMENT = /* glsl */ `
    uniform sampler2D uMap;
    uniform vec2 uSize;
    uniform float uRadius;
    uniform float uFade;
    varying vec2 vUv;

    float sdRoundBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }

    void main() {
        vec2 uv = vUv;
        if (!gl_FrontFacing) uv.x = 1.0 - uv.x; // un-mirror the back face

        vec2 p = (vUv - 0.5) * uSize;
        float d = sdRoundBox(p, uSize * 0.5, uRadius);
        float aa = fwidth(d);
        float mask = 1.0 - smoothstep(-aa, aa, d);
        if (mask < 0.004) discard;

        vec3 col = texture2D(uMap, uv).rgb;

        // Hairline inner rim so bright photos separate from the light bg.
        float rim = 1.0 - smoothstep(0.0, 0.045, -d);
        col *= 1.0 - rim * 0.07;

        if (!gl_FrontFacing) col *= 0.86;

        gl_FragColor = vec4(col, mask * uFade);
        #include <colorspace_fragment>
    }
`;

export interface CardDatum {
    id: number;
    title: string;
    author: string;
    thumbUrl: string;
    fullUrl: string;
    /** World-unit card size — derived from the photo's true aspect ratio. */
    width: number;
    height: number;
    /** Slot transform inside the ring group. */
    position: THREE.Vector3;
    rotationY: number;
    tiltZ: number;
}

export interface CardHandle {
    datum: CardDatum;
    slot: THREE.Group;
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    thumbTexture: THREE.Texture;
}

interface Props {
    datum: CardDatum;
    dockedId: number | null;
    onSelect: (id: number) => void;
    registry: Map<number, CardHandle>;
    /** Lets the ring pause its idle auto-spin while a card is being examined. */
    onActivity?: () => void;
}

const RingCard: React.FC<Props> = ({ datum, dockedId, onSelect, registry, onActivity }) => {
    const slotRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const { gl } = useThree();

    const texture = useTexture(datum.thumbUrl);
    useMemo(() => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    }, [texture, gl]);

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                uniforms: {
                    uMap: { value: texture },
                    uSize: { value: new THREE.Vector2(datum.width, datum.height) },
                    // Height-relative so every card shows identical rounding.
                    uRadius: { value: datum.height * 0.085 },
                    uFade: { value: 0 }, // entrance animation fades cards in
                },
                transparent: true,
                depthWrite: true,
                side: THREE.DoubleSide,
            }),
        [texture, datum.width, datum.height],
    );

    useEffect(() => () => material.dispose(), [material]);

    // Register with the ring so it can orchestrate docking / dimming / swaps.
    useEffect(() => {
        if (!slotRef.current || !meshRef.current) return;
        registry.set(datum.id, {
            datum,
            slot: slotRef.current,
            mesh: meshRef.current,
            material,
            thumbTexture: texture,
        });
        return () => {
            registry.delete(datum.id);
        };
    }, [datum, material, texture, registry]);

    const anyDocked = dockedId !== null;
    const hoverActive = hovered && !anyDocked;
    useCursor(hoverActive);

    // Hover lift: animate the mesh (local, inside the slot) so docking —
    // which animates the slot — never fights with hover.
    useFrame((_, delta) => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const targetLift = hoverActive ? 0.16 : 0;
        const targetScale = hoverActive ? 1.045 : 1;
        mesh.position.z = THREE.MathUtils.damp(mesh.position.z, targetLift, 9, delta);
        const s = THREE.MathUtils.damp(mesh.scale.x / datum.width, targetScale, 9, delta);
        mesh.scale.set(datum.width * s, datum.height * s, 1);
    });

    return (
        <group
            ref={slotRef}
            position={datum.position}
            rotation={[0, datum.rotationY, datum.tiltZ]}
        >
            <mesh
                ref={meshRef}
                geometry={SHARED_QUAD}
                material={material}
                scale={[datum.width, datum.height, 1]}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    onActivity?.();
                }}
                onPointerMove={() => onActivity?.()}
                onPointerOut={() => setHovered(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    // A real click, not the tail end of a drag.
                    if (e.delta > 8) return;
                    onSelect(datum.id);
                }}
            />
        </group>
    );
};

export default RingCard;
