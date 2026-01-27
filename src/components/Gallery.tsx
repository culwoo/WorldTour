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
                {columns.map((col, colIndex) => (
                    <div key={colIndex} className={styles.column}>
                        {col.map((img) => {
                            // Use item id for label
                            const label = img.id.toString().padStart(2, '0');
                            return (
                                <GalleryItem
                                    key={img.id}
                                    id={img.id}
                                    url={img.url}
                                    title={img.title}
                                    displayLabel={label}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Gallery;
