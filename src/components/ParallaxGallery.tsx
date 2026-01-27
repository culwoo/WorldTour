import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GalleryItem from './GalleryItem';


// We import styles for layout
import styles from '../styles/MixedGallery.module.scss';

interface Props {
    items: typeof import('../data/images').images;
}

gsap.registerPlugin(ScrollTrigger);

const ParallaxGallery: React.FC<Props> = ({ items }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current) return;

        const mm = gsap.matchMedia();

        mm.add("(min-width: 769px)", () => {
            const oddColumns = gsap.utils.toArray<HTMLElement>('.' + styles.oddColumn);
            const evenColumns = gsap.utils.toArray<HTMLElement>('.' + styles.evenColumn);

            // Parallax Effect
            // Odd columns move up faster
            oddColumns.forEach(p => {
                gsap.to(p, {
                    y: -100,
                    ease: "none",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            });

            // Even columns move down (or slower up)
            evenColumns.forEach(p => {
                gsap.to(p, {
                    y: 100,
                    ease: "none",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            });
        });

    }, { scope: containerRef });

    // Split items into 2 columns for this section
    const col1 = items.filter((_, i) => i % 2 === 0);
    const col2 = items.filter((_, i) => i % 2 !== 0);

    return (
        <div ref={containerRef} className={styles.parallaxSection}>
            <div className={styles.columnWrapper}>
                <div className={styles.oddColumn}>
                    {col1.map(img => (
                        <div key={img.id} className={styles.verticalItem}>
                            <GalleryItem
                                id={img.id}
                                url={img.url}
                                title={img.title}
                                displayLabel={img.id.toString().padStart(2, '0')}
                            />
                        </div>
                    ))}
                </div>
                <div className={styles.evenColumn}>
                    {col2.map((img, i) => {
                        const isLargeGap = i < 2;
                        return (
                            <div key={img.id} className={`${styles.verticalItem} ${isLargeGap ? styles.largeGap : ''}`}>
                                <GalleryItem
                                    id={img.id}
                                    url={img.url}
                                    title={img.title}
                                    displayLabel={img.id.toString().padStart(2, '0')}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default ParallaxGallery;
