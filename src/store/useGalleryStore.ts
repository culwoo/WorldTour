import { create } from 'zustand';

/* import type { EffectType } from '../components/Three/Materials'; */

export interface GalleryItemState {
    id: number;
    url: string;
    ref: HTMLElement | null;
    uHover: number; // 0 to 1
    zIndex: number;
}

interface GalleryStore {
    items: GalleryItemState[];
    registerItem: (id: number, url: string, ref: HTMLElement, zIndex?: number) => void;
    unregisterItem: (id: number) => void;
    updateHover: (id: number, hover: boolean) => void;
}

export const useGalleryStore = create<GalleryStore>((set) => ({
    items: [],
    registerItem: (id, url, ref, zIndex = 0) => set((state) => {
        // Check if exists
        const existing = state.items.find(item => item.id === id);
        if (existing) {
            // Optional: if already exists, maybe update zIndex?
            if (existing.zIndex !== zIndex) {
                return {
                    items: state.items.map(i => i.id === id ? { ...i, zIndex } : i)
                }
            }
            return state;
        }
        return { items: [...state.items, { id, url, ref, uHover: 0, zIndex }] };
    }),
    unregisterItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
    })),
    updateHover: (id, hover) => set((state) => ({
        items: state.items.map(item =>
            item.id === id ? { ...item, uHover: hover ? 1 : 0 } : item
        )
    }))
}));
