import React from 'react';
import styles from './Marquee.module.scss';

interface Props {
    text: string;
    direction?: 'left' | 'right';
    speed?: number; // Duration in seconds
}

const Marquee: React.FC<Props> = ({ text, direction = 'left', speed = 20 }) => {
    return (
        <div className={styles.marqueeContainer}>
            <div
                className={styles.marqueeContent}
                style={{
                    animationDuration: `${speed}s`,
                    animationDirection: direction === 'right' ? 'reverse' : 'normal'
                }}
            >
                {/* Repeat text enough to cover screen seamlessly */}
                {[...Array(4)].map((_, i) => (
                    <span key={i} className={styles.textItem}>{text}</span>
                ))}
            </div>
            {/* Duplicate for seamless loop */}
            <div
                className={styles.marqueeContent}
                style={{
                    animationDuration: `${speed}s`,
                    animationDirection: direction === 'right' ? 'reverse' : 'normal'
                }}
                aria-hidden="true"
            >
                {[...Array(4)].map((_, i) => (
                    <span key={i} className={styles.textItem}>{text}</span>
                ))}
            </div>
        </div>
    );
};

export default Marquee;
