import styles from '../styles/FilmGrain.module.scss';

/**
 * Full-screen film-grain + vignette overlay.
 *
 * Pure CSS/SVG so it costs essentially nothing: the grain is one tiled
 * feTurbulence tile animated with a stepped keyframe (GPU-composited transform),
 * and the vignette is a static radial gradient. Sits above the whole page but
 * ignores pointer events. Honors prefers-reduced-motion (animation disabled).
 */
const FilmGrain = () => (
    <div className={styles.wrap} aria-hidden="true">
        <div className={styles.grain} />
        <div className={styles.vignette} />
    </div>
);

export default FilmGrain;
