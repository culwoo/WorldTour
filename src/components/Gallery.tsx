import React, { useMemo } from 'react';
import GalleryItem from './GalleryItem';
import { images } from '../data/images';
import styles from '../styles/Gallery.module.scss';

const Gallery: React.FC = () => {
    // Distribute images into 3 columns
    const columns = useMemo(() => {
        const cols = [[], [], []] as typeof images[];
        images.forEach((img, i) => {
            cols[i % 3].push(img);
        });
        return cols;
    }, []);

    return (
        <div className={styles.gallerySection}>
            <div className={styles.gallery}>
                {columns.map((items, colIndex) => (
                    <div key={colIndex} className={styles.column}>
                        {items.map((item) => (
                            <GalleryItem
                                key={item.id}
                                id={item.id}
                                url={item.url}
                                title={item.title}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Gallery;

