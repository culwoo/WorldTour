import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/all';
import { useGSAP } from '@gsap/react';
import GalleryItem from './GalleryItem';
import styles from '../styles/HorizontalGallery.module.scss';
// import { getLenisInstance } from '../store/lenisStore';

gsap.registerPlugin(ScrollTrigger, Observer);



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

        // ENABLED for mobile as well now.
        // const isMobile = window.matchMedia('(max-width: 768px)').matches;
        // if (isMobile) return; 

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

        // Horizontal Swipe Helper for Mobile
        // Maps horizontal swipe gestures to vertical scroll, 
        // effectively driving the pinned scroll animation.
        Observer.create({
            target: wrapperRef.current,
            type: "touch,pointer",
            onChangeX: (self) => {
                const st = ScrollTrigger.getById("horizontal-gallery-trigger");
                if (!st) return;

                // INVERTED Direction based on user feedback.
                // Finger Left (deltaX > 0) -> formerly caused scroll down. User said "Opposite".
                // So now Finger Left -> Scroll Up.
                // Wait... "Right to Left swipe (Finger Left) -> Images Right to Left".
                // Images R-to-L means we are ADVANCING (Scrolling Down).
                // So Finger Left should Scroll Down.
                // User said: "It moves opposite".
                // Implying currently Finger Left -> Scrolls Up?
                // I will use -1 * deltaX to flip whatever it was.

                // ADJUSTED: 
                // Previous: window.scrollBy(0, self.deltaX * sensitivity);
                // New: window.scrollBy(0, -self.deltaX * sensitivity);
                const sensitivity = 2.5;
                const moveY = -self.deltaX * sensitivity;

                // BOUNDARY CHECK
                // Prevent horizontal swipe from exiting the phase.
                // User requirement: "Awkward to use horiz swipe to scroll vertically at edges".

                // Check if we are at limits
                const p = st.progress;

                // If attempting to go BACK (moveY < 0) and we are near start (p <= 0.001) -> BLOCK.
                if (moveY < 0 && p <= 0.001) return;

                // If attempting to go FWD (moveY > 0) and we are near end (p >= 0.999) -> BLOCK.
                if (moveY > 0 && p >= 0.999) return;

                window.scrollBy(0, moveY);
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

                    {items.map((img, index) => (
                        <div key={img.id} className={styles.itemWrapper}>
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
