import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GalleryItem from './GalleryItem';
import styles from '../styles/MixedGallery.module.scss';

interface Props {
    items: typeof import('../data/images').images;
}

gsap.registerPlugin(ScrollTrigger);

const StackGalleryMobile: React.FC<Props> = ({ items }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!wrapperRef.current || !containerRef.current) return;

        const cards = gsap.utils.toArray<HTMLElement>('.' + styles.stackCard, containerRef.current);

        // Native Sticky Logic:
        // Identify scroll progress of the wrapper relative to viewport.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrapperRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            }
        });

        const totalDuration = 1;
        const segment = totalDuration / cards.length;

        cards.forEach((card, i) => {
            if (i === cards.length - 1) return; // Last card stays

            tl.to(card, {
                yPercent: -120, // Fly up
                opacity: 0,
                scale: 0.9,
                rotation: -10 + Math.random() * 20,
                ease: "power1.inOut",
                duration: segment,
            }, i * segment);
        });

    }, { scope: wrapperRef, dependencies: [items] });

    return (
        <div
            ref={wrapperRef}
            className={styles.stackSection}
            style={{
                height: `${items.length * 80 + 100}vh`,
                position: 'relative'
            }}
        >
            <div
                ref={containerRef}
                className={styles.stackContainer}
                style={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}
            >
                {items.map((img, index) => (
                    <div
                        key={img.id}
                        className={styles.stackCard}
                        style={{
                            zIndex: items.length - index,
                        }}
                    >
                        <GalleryItem
                            id={img.id}
                            url={img.url}
                            title={img.title}
                            displayLabel={img.id.toString().padStart(2, '0')}
                            // @ts-ignore
                            orientation={img.orientation}
                            zPriority={items.length - index}
                            useWebGL={false}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StackGalleryMobile;
