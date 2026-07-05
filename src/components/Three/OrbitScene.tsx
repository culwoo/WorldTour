import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import PhotoRing from './PhotoRing';

export const ORBIT_BG = '#f5f4f1';

interface Props {
    dockedId: number | null;
    onDockChange: (id: number | null) => void;
}

/**
 * Orbit scene — deliberately minimal renderer:
 * - `flat` (no tone mapping) + unlit shader cards -> photos keep their exact
 *   colors, nothing to light, nothing to post-process.
 * - No EffectComposer. Anti-aliasing comes from MSAA, corner rounding from
 *   the card shader. This is what keeps it at a rock-solid 60fps.
 */
const OrbitScene: React.FC<Props> = ({ dockedId, onDockChange }) => {
    // Total pointer travel of the last gesture — lets us tell a real
    // "click on empty space" (undock) apart from the end of a drag.
    const gestureRef = useRef({ dragDist: 0 });

    return (
        <Canvas
            flat
            dpr={[1, 2]}
            gl={{
                antialias: true,
                alpha: false,
                stencil: false,
                powerPreference: 'high-performance',
            }}
            camera={{ fov: 36, near: 0.1, far: 80, position: [0, 0, 14] }}
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
            onPointerMissed={() => {
                if (gestureRef.current.dragDist < 8) onDockChange(null);
            }}
        >
            <color attach="background" args={[ORBIT_BG]} />
            <Suspense fallback={null}>
                <PhotoRing
                    dockedId={dockedId}
                    onDockChange={onDockChange}
                    gestureRef={gestureRef}
                />
            </Suspense>
        </Canvas>
    );
};

export default OrbitScene;
