import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGalleryStore } from '../store/useGalleryStore';
import { images } from '../data/images';
import { imageMeta, ringTextureUrl } from '../data/imageMeta';
import { getLenisInstance } from '../store/lenisStore';
import styles from '../styles/Lightbox.module.scss';

/**
 * Click-to-expand lightbox.
 *
 * FLIP animation: the photo appears to lift straight out of its spot in the
 * gallery and fill the screen. It opens instantly with the 1024px thumbnail,
 * then swaps to the full-resolution original the moment it decodes — so the
 * expanded view is genuinely full-res, with zero wait.
 */
const Lightbox = () => {
    const focusedId = useGalleryStore((s) => s.focusedId);
    const focusRect = useGalleryStore((s) => s.focusRect);
    const clearFocus = useGalleryStore((s) => s.clearFocus);

    const backdropRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const captionRef = useRef<HTMLDivElement>(null);
    const closing = useRef(false);

    const [fullLoaded, setFullLoaded] = useState(false);

    const photo = focusedId != null ? images.find((i) => i.id === focusedId) ?? null : null;
    const fileName = photo ? photo.url.split('/').pop() ?? '' : '';
    const aspect = imageMeta[fileName]?.aspect ?? 1;

    const computeTarget = useCallback(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxW = vw * 0.9;
        const maxH = vh * 0.88;
        let tw = maxW;
        let th = tw / aspect;
        if (th > maxH) {
            th = maxH;
            tw = th * aspect;
        }
        return { tw, th, tLeft: (vw - tw) / 2, tTop: (vh - th) / 2 };
    }, [aspect]);

    const close = useCallback(() => {
        if (closing.current || !frameRef.current || !focusRect) {
            clearFocus();
            return;
        }
        closing.current = true;
        const { tw, th, tLeft, tTop } = computeTarget();
        const scaleX = focusRect.width / tw;
        const scaleY = focusRect.height / th;
        const tx = focusRect.left + focusRect.width / 2 - (tLeft + tw / 2);
        const ty = focusRect.top + focusRect.height / 2 - (tTop + th / 2);

        gsap.to(captionRef.current, { autoAlpha: 0, duration: 0.25 });
        gsap.to(backdropRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' });
        gsap.to(frameRef.current, {
            x: tx,
            y: ty,
            scaleX,
            scaleY,
            duration: 0.62,
            ease: 'power3.inOut',
            onComplete: () => {
                closing.current = false;
                clearFocus();
            },
        });
    }, [focusRect, computeTarget, clearFocus]);

    // Entrance FLIP + scroll lock
    useEffect(() => {
        if (focusedId == null || !focusRect || !frameRef.current) return;
        setFullLoaded(false);
        closing.current = false;

        const lenis = getLenisInstance();
        lenis?.stop();
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const { tw, th, tLeft, tTop } = computeTarget();
        const frame = frameRef.current;
        gsap.set(frame, { left: tLeft, top: tTop, width: tw, height: th, transformOrigin: 'center center' });

        const scaleX = focusRect.width / tw;
        const scaleY = focusRect.height / th;
        const tx = focusRect.left + focusRect.width / 2 - (tLeft + tw / 2);
        const ty = focusRect.top + focusRect.height / 2 - (tTop + th / 2);

        gsap.fromTo(
            frame,
            { x: tx, y: ty, scaleX, scaleY },
            { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.72, ease: 'power3.out' },
        );
        gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
        gsap.fromTo(
            captionRef.current,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.35, ease: 'power2.out' },
        );

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
            lenis?.start();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedId]);

    if (focusedId == null || !photo) return null;

    return (
        <div className={styles.root}>
            <div ref={backdropRef} className={styles.backdrop} onClick={close} />

            <div ref={frameRef} className={styles.frame} onClick={close}>
                {/* Instant thumbnail underneath */}
                <img className={styles.thumb} src={ringTextureUrl(photo.url)} alt="" draggable={false} />
                {/* Full-resolution original fades in on decode */}
                <img
                    className={`${styles.full} ${fullLoaded ? styles.fullVisible : ''}`}
                    src={photo.url}
                    alt={photo.title}
                    draggable={false}
                    onLoad={() => setFullLoaded(true)}
                />
            </div>

            <button className={styles.close} onClick={close} aria-label="Close">
                &times;
            </button>

            <div ref={captionRef} className={styles.caption}>
                <h2>{photo.title}</h2>
                <p>{photo.author}</p>
            </div>
        </div>
    );
};

export default Lightbox;
