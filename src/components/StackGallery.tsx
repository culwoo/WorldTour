import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GalleryItem from './GalleryItem';

import styles from '../styles/MixedGallery.module.scss';
import galleryStyles from '../styles/Gallery.module.scss';

interface Props {
    items: typeof import('../data/images').images;
    title?: string;
}

gsap.registerPlugin(ScrollTrigger);

const StackGallery: React.FC<Props> = ({ items, title }) => {
    // containerRef will be the element that gets PINNED
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current) return;

        const cards = gsap.utils.toArray<HTMLElement>('.' + styles.stackCard);

        // Setup initial Card states
        cards.forEach((card, i) => {
            const randomRotation = Math.sin(i * 12.34) * 4;
            gsap.set(card, {
                xPercent: -50,
                yPercent: 120, // Start just below the viewport
                opacity: 0,
                rotation: randomRotation,
                scale: 0.9
            });
        });

        const scrollDistance = Math.max(2000, items.length * 800);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current, // PIN ONLY THE CARD CONTAINER
                start: "top top",
                end: `+=${scrollDistance}`,
                pin: true,
                scrub: 1,
                anticipatePin: 1,
            }
        });

        // Animation Sequence
        cards.forEach((card, i) => {
            // Cards fly in sequentially
            // First card flies in immediately
            const startTime = i * 0.5; // Stagger them simply

            tl.to(card, {
                yPercent: -50, // Center vertically
                xPercent: -50, // Center horizontally
                opacity: 1,
                scale: 1,
                duration: 1,
                ease: "power3.out"
            }, startTime);

            // Previous Info Fade Out
            if (i > 0) {
                const prevCard = cards[i - 1];
                const prevInfo = prevCard.querySelector('.' + galleryStyles.info);
                if (prevInfo) {
                    tl.to(prevInfo, { opacity: 0, duration: 0.5 }, "<+0.3");
                }
            }
        });

        // Final buffer
        tl.to({}, { duration: 0.5 });

    }, { scope: wrapperRef, dependencies: [items] });

    return (
        <div ref={wrapperRef} className={styles.stackSection} style={{ position: 'relative', zIndex: 50, background: 'transparent' }}>

            {/* 1. Title is part of normal flow - it scrolls AWAY naturally */}
            {title && (
                <div style={{
                    textAlign: 'center',
                    paddingTop: '15vh',
                    paddingBottom: '5vh',
                    position: 'relative',
                    zIndex: 40 // Below pinned container when it arrives
                }}>
                    <h2 style={{
                        fontSize: '4rem',
                        margin: 0,
                        textShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}>
                        {title}
                    </h2>
                </div>
            )}

            {/* 2. Container catches the scroll and PINS itself */}
            <div ref={containerRef} className={styles.stackContainer} style={{ height: '100vh', width: '100%' }}>
                {items.map((img, index) => (
                    <div
                        key={img.id}
                        className={styles.stackCard}
                        style={{
                            zIndex: 100 + index,
                        }}
                    >
                        <GalleryItem
                            id={img.id}
                            url={img.url}
                            title={img.title}
                            displayLabel={img.id.toString().padStart(2, '0')}
                            // @ts-ignore
                            orientation={img.orientation}
                            zPriority={100 + index}
                            useWebGL={false}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StackGallery;
