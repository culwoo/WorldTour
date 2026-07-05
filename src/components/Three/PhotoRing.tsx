import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import RingCard, { type CardDatum, type CardHandle } from './RingCard';
import { images } from '../../data/images';
import { imageMeta, ringTextureUrl } from '../../data/imageMeta';

// ---------------------------------------------------------------------------
// Layout constants (world units)
// ---------------------------------------------------------------------------
const CARD_H = 1.5;      // uniform card height per row
const GAP = 0.34;        // minimum arc gap between neighbouring cards
const ROW_GAP = 0.42;    // vertical gap between the two rows

const MAX_TILT = 1.15;   // rad — how far the ring can be tipped over
const IDLE_DELAY = 4500; // ms before the idle auto-spin resumes
const IDLE_SPEED = 0.09; // rad/s idle spin

interface Layout {
    cards: CardDatum[];
    radius: number;
    boundRadius: number;
}

// Deterministic pseudo-random so the ring looks identical on every visit.
const seededRandom = (seed: number) => () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

/**
 * Two staggered rows around a cylinder. Card widths follow each photo's TRUE
 * aspect ratio (from the generated manifest), and cards are arc-packed with
 * even spacing — so nothing is ever cropped, squashed, or stretched.
 */
function buildLayout(): Layout {
    const rand = seededRandom(1113);

    // Interleave portraits/landscapes so both rows get an even mix.
    const portraits = images.filter((i) => i.orientation === 'portrait');
    const landscapes = images.filter((i) => i.orientation !== 'portrait');
    const interleaved: typeof images = [];
    const maxLen = Math.max(portraits.length, landscapes.length);
    for (let i = 0; i < maxLen; i++) {
        if (portraits[i]) interleaved.push(portraits[i]);
        if (landscapes[i]) interleaved.push(landscapes[i]);
    }

    const half = Math.ceil(interleaved.length / 2);
    const rows = [interleaved.slice(0, half), interleaved.slice(half)];

    const aspectOf = (url: string) => {
        const name = url.split('/').pop() ?? '';
        return imageMeta[name]?.aspect ?? 1;
    };

    // The shared radius must fit the "widest" row.
    const rowCircumference = (row: typeof images) =>
        row.reduce((acc, img) => acc + CARD_H * aspectOf(img.url) + GAP, 0);
    const radius = Math.max(...rows.map(rowCircumference)) / (Math.PI * 2);

    const cards: CardDatum[] = [];

    rows.forEach((row, rowIndex) => {
        const widths = row.map((img) => CARD_H * aspectOf(img.url));
        const totalWidth = widths.reduce((a, b) => a + b, 0);
        // Distribute leftover circumference as extra gap so the row closes
        // into a perfect circle.
        const extraGap = (Math.PI * 2 * radius - totalWidth) / row.length;
        const y = (rowIndex === 0 ? 1 : -1) * ((CARD_H + ROW_GAP) / 2);

        // Offset the second row by half a slot for a brick-like stagger.
        let cursor = rowIndex === 1 ? (widths[0] + extraGap) / (2 * radius) : 0;

        row.forEach((img, i) => {
            const w = widths[i];
            const step = (w + extraGap) / radius;
            const theta = cursor + step / 2;
            cursor += step;

            const rJitter = (rand() - 0.5) * 0.05;
            const yJitter = (rand() - 0.5) * 0.045;
            const tiltZ = (rand() - 0.5) * 0.05;
            const r = radius + rJitter;

            cards.push({
                id: img.id,
                title: img.title,
                author: img.author,
                thumbUrl: ringTextureUrl(img.url),
                fullUrl: img.url,
                width: w,
                height: CARD_H,
                position: new THREE.Vector3(
                    r * Math.sin(theta),
                    y + yJitter,
                    r * Math.cos(theta),
                ),
                rotationY: theta,
                tiltZ,
            });
        });
    });

    const yTop = (CARD_H + ROW_GAP) / 2 + CARD_H / 2;
    const boundRadius = Math.sqrt(radius * radius + yTop * yTop) + 0.35;

    return { cards, radius, boundRadius };
}

// ---------------------------------------------------------------------------
// Full-resolution textures: loaded on demand when a card is docked, uploaded
// to the GPU during the dock animation, and kept in a tiny LRU cache.
// The ring itself only ever holds the lightweight 1024px thumbnails.
// ---------------------------------------------------------------------------
const FULL_CACHE_LIMIT = 4;

interface Props {
    dockedId: number | null;
    onDockChange: (id: number | null) => void;
    gestureRef: React.MutableRefObject<{ dragDist: number }>;
}

const PhotoRing: React.FC<Props> = ({ dockedId, onDockChange, gestureRef }) => {
    const { camera, gl, size } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const registryRef = useRef(new Map<number, CardHandle>());
    const layout = useMemo(buildLayout, []);

    // --- rotation / zoom state (refs — nothing re-renders per frame) -------
    const rot = useRef({ x: 0.55, y: -1.15 });
    const target = useRef({ x: 0.3, y: 0.15 });
    const velY = useRef(0);
    const zoom = useRef({ current: 0, target: 0, min: 0, max: 0 });
    const lastInteraction = useRef(performance.now());
    const idleVel = useRef(0);
    const frozen = useRef(false); // true while docked / dock animation runs
    const introRotTween = useRef<gsap.core.Tween | null>(null);

    const dockedRef = useRef<number | null>(null);
    const prevDockedRef = useRef<number | null>(null);

    // Click on a card toggles docking (click again to release).
    const handleSelect = useCallback(
        (id: number) => {
            onDockChange(dockedRef.current === id ? null : id);
        },
        [onDockChange],
    );

    // Any pointer attention on a card counts as interaction — keeps the idle
    // auto-spin from dragging a card away from under the cursor.
    const handleActivity = useCallback(() => {
        lastInteraction.current = performance.now();
    }, []);
    const activeTweens = useRef<gsap.core.Tween[]>([]);
    const fullCache = useRef(new Map<number, THREE.Texture>());

    // --- responsive camera fit ---------------------------------------------
    useEffect(() => {
        const cam = camera as THREE.PerspectiveCamera;
        const vFov = THREE.MathUtils.degToRad(cam.fov);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / size.height));
        const fitZ = (layout.boundRadius / Math.tan(Math.min(vFov, hFov) / 2)) * 1.06;

        const z = zoom.current;
        z.min = layout.radius + 2.1;
        z.max = fitZ * 1.45;
        if (z.target === 0) {
            // First mount: start framed.
            z.target = fitZ;
            z.current = fitZ;
            cam.position.set(0, 0, fitZ);
            cam.lookAt(0, 0, 0);
        } else {
            z.target = THREE.MathUtils.clamp(z.target, z.min, z.max);
        }
    }, [camera, size.width, size.height, layout]);

    // --- input: drag to spin, pinch/wheel to zoom ---------------------------
    useEffect(() => {
        const dom = gl.domElement;
        dom.style.touchAction = 'none';
        const pointers = new Map<number, { x: number; y: number }>();
        let pinchDist = 0;
        let lastMoveT = 0;

        const onDown = (e: PointerEvent) => {
            introRotTween.current?.kill();
            introRotTween.current = null;
            dom.setPointerCapture(e.pointerId);
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            gestureRef.current.dragDist = 0;
            velY.current = 0;
            lastMoveT = performance.now();
            lastInteraction.current = performance.now();
            if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
            }
        };

        const onMove = (e: PointerEvent) => {
            const prev = pointers.get(e.pointerId);
            if (!prev) return;
            const dx = e.clientX - prev.x;
            const dy = e.clientY - prev.y;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            gestureRef.current.dragDist += Math.abs(dx) + Math.abs(dy);

            if (frozen.current) return;

            if (pointers.size === 1) {
                // Grab-the-object mapping: the front of the ring follows the
                // pointer. Resolution-independent (normalised by viewport).
                const rotDx = (dx / dom.clientWidth) * Math.PI * 1.7;
                const rotDy = (dy / dom.clientHeight) * Math.PI * 0.85;
                target.current.y += rotDx;
                target.current.x = THREE.MathUtils.clamp(
                    target.current.x + rotDy,
                    -MAX_TILT,
                    MAX_TILT,
                );

                const now = performance.now();
                const dt = Math.max(8, now - lastMoveT) / 1000;
                lastMoveT = now;
                const instVel = rotDx / dt;
                velY.current = THREE.MathUtils.lerp(velY.current, instVel, 0.35);
                velY.current = THREE.MathUtils.clamp(velY.current, -7, 7);
            } else if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (pinchDist > 0 && dist > 0) {
                    const z = zoom.current;
                    z.target = THREE.MathUtils.clamp(z.target * (pinchDist / dist), z.min, z.max);
                }
                pinchDist = dist;
            }
            lastInteraction.current = performance.now();
        };

        const onUp = (e: PointerEvent) => {
            pointers.delete(e.pointerId);
            pinchDist = 0;
            lastInteraction.current = performance.now();
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            introRotTween.current?.kill();
            introRotTween.current = null;
            if (frozen.current) return;
            const z = zoom.current;
            z.target = THREE.MathUtils.clamp(z.target + e.deltaY * 0.012, z.min, z.max);
            target.current.y -= e.deltaX * 0.0016;
            lastInteraction.current = performance.now();
        };

        dom.addEventListener('pointerdown', onDown);
        dom.addEventListener('pointermove', onMove);
        dom.addEventListener('pointerup', onUp);
        dom.addEventListener('pointercancel', onUp);
        dom.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            dom.removeEventListener('pointerdown', onDown);
            dom.removeEventListener('pointermove', onMove);
            dom.removeEventListener('pointerup', onUp);
            dom.removeEventListener('pointercancel', onUp);
            dom.removeEventListener('wheel', onWheel);
        };
    }, [gl, gestureRef]);

    // --- per-frame integration ----------------------------------------------
    useFrame((_, delta) => {
        const group = groupRef.current;
        if (!group) return;

        if (!frozen.current) {
            // Inertia after release + idle auto-spin.
            target.current.y += velY.current * delta;
            velY.current *= Math.exp(-2.8 * delta);

            const idleFor = performance.now() - lastInteraction.current;
            const wantIdle = idleFor > IDLE_DELAY ? IDLE_SPEED : 0;
            idleVel.current = THREE.MathUtils.damp(idleVel.current, wantIdle, 1.4, delta);
            target.current.y += idleVel.current * delta;

            rot.current.x = THREE.MathUtils.damp(rot.current.x, target.current.x, 7.5, delta);
            rot.current.y = THREE.MathUtils.damp(rot.current.y, target.current.y, 7.5, delta);
            group.rotation.set(rot.current.x, rot.current.y, 0);

            const z = zoom.current;
            z.current = THREE.MathUtils.damp(z.current, z.target, 6, delta);
            camera.position.z = z.current;
            camera.lookAt(0, 0, 0);
        }
    });

    // --- docking: fly the clicked card out of the ring to the camera --------
    useEffect(() => {
        dockedRef.current = dockedId;
        const group = groupRef.current;
        if (!group) return;

        activeTweens.current.forEach((t) => t.kill());
        activeTweens.current = [];

        const registry = registryRef.current;
        const cam = camera as THREE.PerspectiveCamera;

        const homeQuat = (d: CardDatum) =>
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, d.rotationY, d.tiltZ));

        if (dockedId !== null) {
            const handle = registry.get(dockedId);
            if (!handle) return;

            // Switching straight from one docked card to another: send the
            // previous card home first so it never lingers mid-air.
            const prevId = prevDockedRef.current;
            if (prevId !== null && prevId !== dockedId) {
                const prev = registry.get(prevId);
                if (prev) {
                    const sp = prev.slot.position.clone();
                    const sq = prev.slot.quaternion.clone();
                    const eq = homeQuat(prev.datum);
                    const pt = { v: 0 };
                    activeTweens.current.push(
                        gsap.to(pt, {
                            v: 1,
                            duration: 0.8,
                            ease: 'power3.inOut',
                            onUpdate: () => {
                                prev.slot.position.lerpVectors(sp, prev.datum.position, pt.v);
                                prev.slot.quaternion.slerpQuaternions(sq, eq, pt.v);
                            },
                            onComplete: () => {
                                prev.material.uniforms.uMap.value = prev.thumbTexture;
                            },
                        }),
                    );
                }
            }

            prevDockedRef.current = dockedId;
            frozen.current = true;

            const { datum, slot, material } = handle;

            // Distance at which the card fills ~62% of the viewport height
            // (or ~78% of its width, whichever is more constraining).
            const vFov = THREE.MathUtils.degToRad(cam.fov);
            const tanV = Math.tan(vFov / 2);
            const distH = datum.height / (0.62 * 2 * tanV);
            const distW = datum.width / (0.78 * 2 * tanV * cam.aspect);
            const dist = Math.max(distH, distW, 1.5);

            // If the user is zoomed in too close for the card to sit in front
            // of the ring, dolly the camera back during the dock.
            const requiredZ = layout.radius + dist + 0.6;
            const camZ = Math.max(cam.position.z, requiredZ);
            if (camZ > cam.position.z + 0.001) {
                const z = zoom.current;
                z.target = THREE.MathUtils.clamp(camZ, z.min, z.max);
                const zt = { v: cam.position.z };
                activeTweens.current.push(
                    gsap.to(zt, {
                        v: camZ,
                        duration: 1.05,
                        ease: 'power3.inOut',
                        onUpdate: () => {
                            cam.position.z = zt.v;
                            z.current = zt.v;
                            cam.lookAt(0, 0, 0);
                        },
                    }),
                );
            }

            const worldPos = new THREE.Vector3(0, 0, camZ - dist);
            const localPos = group.worldToLocal(worldPos.clone());
            const groupQuat = group.getWorldQuaternion(new THREE.Quaternion());
            const localQuat = groupQuat.invert(); // world-identity, facing camera

            const startPos = slot.position.clone();
            const startQuat = slot.quaternion.clone();
            const t = { v: 0 };
            activeTweens.current.push(
                gsap.to(t, {
                    v: 1,
                    duration: 1.05,
                    ease: 'power3.inOut',
                    onUpdate: () => {
                        slot.position.lerpVectors(startPos, localPos, t.v);
                        slot.quaternion.slerpQuaternions(startQuat, localQuat, t.v);
                    },
                }),
            );

            // Dim every other card.
            registry.forEach((h, id) => {
                if (id === dockedId) return;
                activeTweens.current.push(
                    gsap.to(h.material.uniforms.uFade, {
                        value: 0.15,
                        duration: 0.7,
                        ease: 'power2.out',
                    }),
                );
            });
            activeTweens.current.push(
                gsap.to(material.uniforms.uFade, { value: 1, duration: 0.4 }),
            );

            // Swap in the full-resolution photo (uploaded during the tween so
            // the swap itself is invisible).
            const cached = fullCache.current.get(dockedId);
            if (cached) {
                material.uniforms.uMap.value = cached;
            } else {
                new THREE.TextureLoader().load(datum.fullUrl, (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
                    gl.initTexture(tex);
                    const cache = fullCache.current;
                    cache.set(dockedId, tex);
                    if (cache.size > FULL_CACHE_LIMIT) {
                        const [oldId] = cache.keys();
                        if (oldId !== dockedRef.current) {
                            cache.get(oldId)?.dispose();
                            cache.delete(oldId);
                        }
                    }
                    if (dockedRef.current === dockedId) {
                        material.uniforms.uMap.value = tex;
                    }
                });
            }
        } else if (prevDockedRef.current !== null) {
            // Undock: return the card to its slot, restore the ring.
            const handle = registry.get(prevDockedRef.current);
            prevDockedRef.current = null;
            if (!handle) {
                frozen.current = false;
                return;
            }
            const { datum, slot, material, thumbTexture } = handle;

            const startPos = slot.position.clone();
            const startQuat = slot.quaternion.clone();
            const endQuat = homeQuat(datum);
            const t = { v: 0 };
            activeTweens.current.push(
                gsap.to(t, {
                    v: 1,
                    duration: 0.95,
                    ease: 'power3.inOut',
                    onUpdate: () => {
                        slot.position.lerpVectors(startPos, datum.position, t.v);
                        slot.quaternion.slerpQuaternions(startQuat, endQuat, t.v);
                    },
                    onComplete: () => {
                        material.uniforms.uMap.value = thumbTexture;
                        frozen.current = false;
                        lastInteraction.current = performance.now();
                    },
                }),
            );

            registry.forEach((h) => {
                activeTweens.current.push(
                    gsap.to(h.material.uniforms.uFade, {
                        value: 1,
                        duration: 0.7,
                        ease: 'power2.out',
                    }),
                );
            });
        }
    }, [dockedId, camera, gl, layout.radius]);

    // --- entrance: cards cascade in while the ring swings to rest -----------
    useEffect(() => {
        const registry = registryRef.current;
        const handles = layout.cards
            .map((c) => registry.get(c.id))
            .filter((h): h is CardHandle => Boolean(h));
        if (handles.length === 0) return;

        handles.forEach((h) => h.slot.scale.setScalar(0.55));
        const fades = handles.map((h) => h.material.uniforms.uFade);
        const scales = handles.map((h) => h.slot.scale);

        const fadeTween = gsap.to(fades, {
            value: 1,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.032,
        });
        const scaleTween = gsap.to(scales, {
            x: 1,
            y: 1,
            z: 1,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.032,
        });

        const rotProxy = { v: rot.current.y };
        introRotTween.current = gsap.to(rotProxy, {
            v: target.current.y,
            duration: 2.0,
            ease: 'power3.out',
            onUpdate: () => {
                rot.current.y = rotProxy.v;
            },
        });
        lastInteraction.current = performance.now();

        return () => {
            fadeTween.kill();
            scaleTween.kill();
            introRotTween.current?.kill();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout]);

    // Dispose the full-res cache when leaving the page.
    useEffect(() => {
        const cache = fullCache.current;
        return () => {
            cache.forEach((tex) => tex.dispose());
            cache.clear();
        };
    }, []);

    return (
        <group ref={groupRef} rotation={[rot.current.x, rot.current.y, 0]}>
            {layout.cards.map((card) => (
                <RingCard
                    key={card.id}
                    datum={card}
                    dockedId={dockedId}
                    onSelect={handleSelect}
                    onActivity={handleActivity}
                    registry={registryRef.current}
                />
            ))}
        </group>
    );
};

export default PhotoRing;
