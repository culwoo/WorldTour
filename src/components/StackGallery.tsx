import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GalleryItem from './GalleryItem';

import styles from '../styles/MixedGallery.module.scss';
import galleryStyles from '../styles/Gallery.module.scss';

interface Props {
    items: typeof import('../data/images').images;
}

gsap.registerPlugin(ScrollTrigger);

const StackGallery: React.FC<Props> = ({ items }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!wrapperRef.current || !containerRef.current) return;

        const cards = gsap.utils.toArray<HTMLElement>('.' + styles.stackCard);

        // Stack Effect used to be here

        // Stack Effect
        // We pin the container for X amount of scroll pixels
        // As we scroll, cards slide UP from bottom (or scale in)

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrapperRef.current,
                start: "top top", // Pin when top hits top
                end: "+=4000", // Slower animation (more scroll distance)
                pin: true,
                scrub: 1,
                anticipatePin: 1
            }
        });

        cards.forEach((card, i) => {
            const randomRotation = Math.sin(i * 12.34) * 4;

            if (i === 0) {
                // First card: Center it immediately.
                // CSS has left: 50%, top: 50%. We need translate(-50%, -50%) to center.
                // We set xPercent, yPercent ensures robust centering unlike raw transform strings.
                gsap.set(card, {
                    xPercent: -50,
                    yPercent: -50,
                    rotation: randomRotation,
                    opacity: 1
                });
                return;
            }

            // Other cards: Start BELOW the view (yPercent 150) but CENTERED horizontally (xPercent -50)
            gsap.set(card, {
                xPercent: -50,
                yPercent: 150,
                opacity: 0,
                rotation: randomRotation
            });

            // Animate UP to center (-50, -50)
            tl.to(card, {
                yPercent: -50,
                // xPercent is already -50, no need to touch it, it will persist
                opacity: 1,
                duration: 1,
                ease: "power2.out"
            }, ">-0.2"); // Overlap slightly for flow

            // Note: We do NOT animate rotation here, so it stays fixed (tilted) as established by user.

            // previous info fade out
            const prevCard = cards[i - 1];
            const prevInfo = prevCard.querySelector('.' + galleryStyles.info);
            if (prevInfo) {
                tl.to(prevInfo, { opacity: 0, duration: 0.5 }, "<");
            }
        });

    }, { scope: wrapperRef });

    return (
        <div ref={wrapperRef} className={styles.stackSection}>
            <div ref={containerRef} className={styles.stackContainer}>

                {items.map((img, index) => (
                    <div
                        key={img.id}
                        className={styles.stackCard}
                        style={{
                            zIndex: 100 + index, // Explicitly force stacking order: later items ON TOP
                        }}
                    >
                        <GalleryItem
                            id={img.id}
                            url={img.url}
                            title={img.title}
                            displayLabel={img.id.toString().padStart(2, '0')}
                            // @ts-ignore
                            orientation={img.orientation}
                            zPriority={100 + index} // Pass explicit Z priority to WebGL (though ignored if !useWebGL)
                            useWebGL={false} // Disable WebGL for stack to avoid rotation mismatch
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StackGallery;
