import React, { useLayoutEffect, useRef } from 'react';
import { useGalleryStore } from '../store/useGalleryStore';
import styles from '../styles/Gallery.module.scss';


interface Props {
    id: number;
    url: string;
    title: string;
    displayLabel: string;
    zPriority?: number;
    useWebGL?: boolean;
    priority?: boolean;
}

const GalleryItem: React.FC<Props> = ({ id, url, title, zPriority = 0, useWebGL = true, priority = false }) => {
    const ref = useRef<HTMLDivElement>(null);
    const registerItem = useGalleryStore((state) => state.registerItem);
    const unregisterItem = useGalleryStore((state) => state.unregisterItem);
    const updateHover = useGalleryStore((state) => state.updateHover);

    useLayoutEffect(() => {
        if (!useWebGL) return;
        if (ref.current) {
            registerItem(id, url, ref.current, zPriority, useWebGL);
        }
        return () => unregisterItem(id);
    }, [id, url, registerItem, unregisterItem, zPriority, useWebGL]);

    // We don't need to force aspect ratio classes since we want to align with the real image size.
    // The width is 100% (of the column), and height is auto.

    return (
        <div
            className={styles.galleryItem}
            ref={ref}
            onMouseEnter={() => useWebGL && updateHover(id, true)}
            onMouseLeave={() => useWebGL && updateHover(id, false)}
        >
            <img
                src={url}
                alt={title}
                className={styles.layoutImage}
                style={{ opacity: useWebGL ? 0 : 1, userSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding={priority ? "sync" : "async"}
            />

        </div>
    );
};

export default GalleryItem;
