import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/all';
import { useGSAP } from '@gsap/react';
import GalleryItem from './GalleryItem';
import { imageMeta } from '../data/imageMeta';
import styles from '../styles/HorizontalGallery.module.scss';

gsap.registerPlugin(ScrollTrigger, Observer);

// Images in the horizontal track are sized height-first (max-height: 85vh),
// so each card's width == aspect * 85vh. Reserve that width up front from the
// aspect manifest so the track's total scrollWidth is correct BEFORE any image
// (some are lazy / off-screen-right) loads — otherwise ScrollTrigger measures a
// too-short pin and releases before the "End of Phase I" card scrolls in.
const CARD_VH = 85;
const aspectFor = (url: string) => {
    const name = url.split('/').pop() ?? '';
    return imageMeta[name]?.aspect ?? 0.6667;
};

interface Props {
    items: typeof import('../data/images').images;
    title?: string;
    subtitle?: string;
    useWebGL?: boolean;
}

const HorizontalGallery: React.FC<Props> = ({ items, title = "The Collection", subtitle = "Scroll to Explore", useWebGL = true }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current || !wrapperRef.current) return;

        // Horizontal Scroll
        gsap.to(containerRef.current, {
            x: () => -(containerRef.current!.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
                id: "horizontal-gallery-trigger",
                trigger: wrapperRef.current,
                start: "top top",
                end: () => `+=${containerRef.current!.scrollWidth}`,
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            }
        });

        // Horizontal Swipe Helper for Mobile: maps horizontal swipe to vertical
        // scroll, driving the pinned animation.
        Observer.create({
            target: wrapperRef.current,
            type: "touch,pointer",
            onChangeX: (self) => {
                const st = ScrollTrigger.getById("horizontal-gallery-trigger");
                if (!st) return;

                const sensitivity = 2.5;
                const moveY = -self.deltaX * sensitivity;

                const p = st.progress;
                if (moveY < 0 && p <= 0.001) return;
                if (moveY > 0 && p >= 0.999) return;

                window.scrollBy(0, moveY);
            }
        });

    }, { scope: wrapperRef, dependencies: [items] });

    // Handle dynamic image loading causing layout shifts
    React.useEffect(() => {
        const imgs = containerRef.current?.querySelectorAll('img');
        if (!imgs || imgs.length === 0) return;

        let rafId: number | null = null;
        let pending = imgs.length;

        const scheduleRefresh = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                ScrollTrigger.refresh();
            });
        };

        const handleImageDone = () => {
            pending -= 1;
            if (pending <= 0) {
                scheduleRefresh();
            }
        };

        imgs.forEach(img => {
            if (img.complete) {
                handleImageDone();
            } else {
                img.addEventListener('load', handleImageDone, { once: true });
                img.addEventListener('error', handleImageDone, { once: true });
            }
        });

        const safetyTimeout = window.setTimeout(scheduleRefresh, 2000);

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            window.clearTimeout(safetyTimeout);
            imgs.forEach(img => {
                img.removeEventListener('load', handleImageDone);
                img.removeEventListener('error', handleImageDone);
            });
        };
    }, [items]);

    return (
        <div ref={wrapperRef} className={styles.scrollWrapper}>
            <div className={styles.stickyContainer}>
                {/* Horizontal Track */}
                <div ref={containerRef} className={styles.track}>
                    {/* Intro Card for the gallery */}
                    <div className={`${styles.itemWrapper} ${styles.introCard}`}>
                        <h2 dangerouslySetInnerHTML={{ __html: title.replace(' ', '<br/>') }} />
                        <p>{subtitle}</p>
                    </div>

                    {items.map((img, index) => (
                        <div
                            key={img.id}
                            className={styles.itemWrapper}
                            style={{ minWidth: `calc(${CARD_VH}vh * ${aspectFor(img.url)})` }}
                        >
                            <GalleryItem
                                id={img.id}
                                url={img.url}
                                title={img.title}
                                displayLabel={img.id.toString().padStart(2, '0')}
                                useWebGL={useWebGL}
                                priority={index < 4}
                            />
                        </div>
                    ))}

                    {/* Outro Card */}
                    <div className={`${styles.itemWrapper} ${styles.outroCard}`}>
                        <h2>End of<br />Phase I</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HorizontalGallery;
