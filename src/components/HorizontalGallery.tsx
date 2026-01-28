import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import GalleryItem from './GalleryItem';
import styles from '../styles/HorizontalGallery.module.scss';
// import { getLenisInstance } from '../store/lenisStore';

gsap.registerPlugin(ScrollTrigger);



interface Props {
    items: typeof import('../data/images').images; // Correctly reference the type of the images array
    title?: string;
    subtitle?: string;
    useWebGL?: boolean;
}

const HorizontalGallery: React.FC<Props> = ({ items, title = "The Collection", subtitle = "Scroll to Explore", useWebGL = true }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current || !wrapperRef.current) return;


        // Better: let the CSS layout define width and we calculate scroll amount

        // Horizontal Scroll
        gsap.to(containerRef.current, {
            x: () => -(containerRef.current!.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
                id: "horizontal-gallery-trigger", // Added ID for clamping logic
                trigger: wrapperRef.current,
                start: "top top",
                end: () => `+=${containerRef.current!.scrollWidth}`,
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            }
        });

    }, { scope: wrapperRef, dependencies: [items] });

    // Handle dynamic image loading causing layout shifts
    React.useEffect(() => {
        const images = containerRef.current?.querySelectorAll('img');
        if (!images || images.length === 0) return;

        let rafId: number | null = null;
        let pending = images.length;

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

        images.forEach(img => {
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
            images.forEach(img => {
                img.removeEventListener('load', handleImageDone);
                img.removeEventListener('error', handleImageDone);
            });
        };
    }, [items]);

    // Mobile horizontal swipe logic REMOVED to prevent scroll locking.
    // Native vertical scroll will drive the horizontal animation via ScrollTrigger.

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

                    {items.map((img) => (
                        <div key={img.id} className={styles.itemWrapper}>
                            <GalleryItem
                                id={img.id}
                                url={img.url}
                                title={img.title}
                                displayLabel={img.id.toString().padStart(2, '0')}
                                useWebGL={useWebGL}
                                // @ts-ignore
                                orientation={img.orientation}
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
