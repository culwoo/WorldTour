import React, { useLayoutEffect, useRef } from 'react';
import { useGalleryStore } from '../store/useGalleryStore';
import { ringTextureUrl } from '../data/imageMeta';
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
    const setFocused = useGalleryStore((state) => state.setFocused);

    useLayoutEffect(() => {
        if (!useWebGL) return;
        if (ref.current) {
            registerItem(id, url, ref.current, zPriority, useWebGL);
        }
        return () => unregisterItem(id);
    }, [id, url, registerItem, unregisterItem, zPriority, useWebGL]);

    const handleClick = () => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setFocused(id, { top: r.top, left: r.left, width: r.width, height: r.height });
    };

    // The layout <img> only defines the on-screen box (aspect ratio) — on
    // desktop the WebGL plane draws over it (opacity 0). Use the lightweight
    // thumbnail so the page never downloads the full-res original just to lay out.
    const layoutSrc = ringTextureUrl(url);

    return (
        <div
            className={styles.galleryItem}
            ref={ref}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => useWebGL && updateHover(id, true)}
            onMouseLeave={() => useWebGL && updateHover(id, false)}
        >
            <img
                src={layoutSrc}
                alt={title}
                className={styles.layoutImage}
                style={{ opacity: useWebGL ? 0 : 1, userSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                decoding={priority ? 'sync' : 'async'}
            />
        </div>
    );
};

export default GalleryItem;
