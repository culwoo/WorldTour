import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useTexture, useProgress } from '@react-three/drei';
import styles from '../styles/SplashScreen.module.scss';
import { images } from '../data/images';

interface Props {
    onComplete: () => void;
}

const SplashScreen: React.FC<Props> = ({ onComplete }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLSpanElement>(null);
    const { progress } = useProgress();

    // We keep a 'display' progress to animate smoothly to the real 'progress'
    const progressRef = useRef({ val: 0 });

    // Preload images immediately when Splash mounts
    useEffect(() => {
        images.forEach((img) => {
            const image = new Image();
            image.src = img.url;
            useTexture.preload(img.url);
        });
    }, []);

    // Effect to animate the counter whenever 'progress' changes
    useEffect(() => {
        // Animate counter from current val to new progress
        gsap.to(progressRef.current, {
            val: progress,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => {
                if (counterRef.current) {
                    counterRef.current.innerText = Math.floor(progressRef.current.val).toString();
                }
            }
        });

        // Completion check
        if (progress === 100) {
            // Add a small delay after hitting 100% for polish
            const timer = setTimeout(() => {
                // Exit Animation
                if (containerRef.current) {
                    const tl = gsap.timeline({
                        onComplete: onComplete
                    });

                    tl.to(`.${styles.title}`, { opacity: 0, duration: 0.5 });
                    tl.to(counterRef.current, { opacity: 0, duration: 0.5 }, "<");
                    tl.to(containerRef.current, {
                        yPercent: -100,
                        duration: 1,
                        ease: "power4.inOut"
                    });
                }
            }, 800); // 800ms delay at 100%
            return () => clearTimeout(timer);
        }
    }, [progress, onComplete]);

    return (
        <div ref={containerRef} className={styles.splashContainer}>
            <div className={styles.content}>
                <h1 className={styles.title}>
                    <span className={styles.line}>World Tour</span>
                    <span className={styles.line} style={{ fontSize: '1.5rem', fontWeight: 300, display: 'block', marginTop: '1rem' }}>
                        The Collection
                    </span>
                </h1>

                <div className={styles.counterWrapper}>
                    <span ref={counterRef} className={styles.counter}>0</span>
                    <span className={styles.symbol}>%</span>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
