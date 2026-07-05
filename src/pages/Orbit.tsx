import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '@react-three/drei';
import ErrorBoundary from '../components/ErrorBoundary';
import OrbitScene from '../components/Three/OrbitScene';
import { images } from '../data/images';
import styles from '../styles/Orbit.module.scss';

const Orbit = () => {
    const navigate = useNavigate();
    const [dockedId, setDockedId] = useState<number | null>(null);
    const [hintVisible, setHintVisible] = useState(true);
    const [revealed, setRevealed] = useState(false);

    const { active, progress } = useProgress();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Reveal once the ring thumbnails are in. Later loads (full-res docks)
    // never bring the loader back.
    useEffect(() => {
        if (revealed) return;
        if (!active && progress >= 100) {
            const t = window.setTimeout(() => setRevealed(true), 250);
            return () => window.clearTimeout(t);
        }
    }, [active, progress, revealed]);

    const handleDockChange = useCallback((id: number | null) => {
        setDockedId(id);
        if (id !== null) setHintVisible(false);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setDockedId(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const dockedImage = useMemo(
        () => images.find((img) => img.id === dockedId) ?? null,
        [dockedId],
    );

    return (
        <div className={styles.container}>
            <ErrorBoundary fallback={null}>
                <OrbitScene dockedId={dockedId} onDockChange={handleDockChange} />
            </ErrorBoundary>

            <div className={`${styles.loader} ${revealed ? styles.loaderHidden : ''}`}>
                <span className={styles.loaderCount}>{Math.round(progress)}%</span>
                <span className={styles.loaderBar}>
                    <span style={{ transform: `scaleX(${progress / 100})` }} />
                </span>
            </div>

            <button className={styles.backButton} onClick={() => navigate('/')}>
                &larr; Back
            </button>

            <div className={styles.heading}>
                <h1>Orbit</h1>
                <span>A revolving archive</span>
            </div>

            <p className={`${styles.hint} ${!hintVisible || !revealed ? styles.hintHidden : ''}`}>
                Drag to spin &middot; Scroll to zoom &middot; Click a photo
            </p>

            <button
                className={`${styles.closeDock} ${dockedId !== null ? styles.closeDockVisible : ''}`}
                onClick={() => setDockedId(null)}
            >
                &times; Close
            </button>

            <div className={`${styles.caption} ${dockedId !== null ? styles.captionVisible : ''}`}>
                <h2>{dockedImage?.title ?? ''}</h2>
                <p>{dockedImage?.author ?? ''}</p>
            </div>
        </div>
    );
};

export default Orbit;
