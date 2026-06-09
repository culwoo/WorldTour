import { useRef, useEffect } from 'react';
import styles from '../styles/GridBackground.module.scss';

/**
 * Interactive grid background.
 *
 * A faint, softly-blurred grid is always present behind the page. A crisp
 * "lens" layer follows the cursor (smoothed with a rAF lerp), revealing the
 * grid sharply in a soft circle around the mouse while the rest stays blurry.
 * The whole grid also drifts a few pixels for a subtle parallax/depth feel.
 *
 * Disabled on touch / small screens and when the user prefers reduced motion.
 */
const GridBackground = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const smallScreen = window.matchMedia('(max-width: 768px)');
    const noHover = window.matchMedia('(hover: none)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (smallScreen.matches || noHover.matches || reduceMotion.matches) return;

    // target = real cursor, cur = smoothed (trailing) position
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cur = { x: target.x, y: target.y };
    let raf = 0;
    let revealed = false;

    const applyVars = () => {
      el.style.setProperty('--mx', `${cur.x}px`);
      el.style.setProperty('--my', `${cur.y}px`);
      // gentle parallax: shift the grid pattern a few px based on cursor offset
      const wx = (cur.x / window.innerWidth - 0.5) * -12;
      const wy = (cur.y / window.innerHeight - 0.5) * -12;
      el.style.setProperty('--wx', `${wx}px`);
      el.style.setProperty('--wy', `${wy}px`);
    };
    applyVars();

    const loop = () => {
      cur.x += (target.x - cur.x) * 0.1;
      cur.y += (target.y - cur.y) * 0.1;
      applyVars();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!revealed) {
        revealed = true;
        el.style.setProperty('--reveal', '1');
      }
    };
    const onLeave = () => {
      revealed = false;
      el.style.setProperty('--reveal', '0');
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.grid} aria-hidden="true">
      <div className={styles.base} />
      <div className={styles.lens} />
    </div>
  );
};

export default GridBackground;
