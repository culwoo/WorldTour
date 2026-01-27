import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import GalleryItem from './GalleryItem';
import styles from '../styles/HorizontalGallery.module.scss';

gsap.registerPlugin(ScrollTrigger);



interface Props {
    items: typeof import('../data/images').images; // Correctly reference the type of the images array
    title?: string;
    subtitle?: string;
}

const HorizontalGallery: React.FC<Props> = ({ items, title = "The Collection", subtitle = "Scroll to Explore" }) => {
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
                trigger: wrapperRef.current,
                start: "top top",
                end: () => `+=${containerRef.current!.scrollWidth}`, // Adjust length slightly
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
        if (!images) return;

        const handleImageLoad = () => {
            ScrollTrigger.refresh();
        };

        images.forEach(img => {
            if (img.complete) {
                handleImageLoad();
            } else {
                img.addEventListener('load', handleImageLoad);
            }
        });

        return () => {
            images.forEach(img => img.removeEventListener('load', handleImageLoad));
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

                    {items.map((img) => (
                        <div key={img.id} className={styles.itemWrapper}>
                            <GalleryItem
                                id={img.id}
                                url={img.url}
                                title={img.title}
                                displayLabel={img.id.toString().padStart(2, '0')}
                                // @ts-ignore
                                orientation={img.orientation}
                            />
                        </div>
                    ))}

                    {/* Outro Card */}
                    <div className={`${styles.itemWrapper} ${styles.outroCard}`}>
                        <h2>End of<br />Exhibition</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HorizontalGallery;
