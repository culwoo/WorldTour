import type Lenis from '@studio-freight/lenis';

let lenisInstance: Lenis | null = null;

export const setLenisInstance = (lenis: Lenis | null) => {
  lenisInstance = lenis;
};

export const getLenisInstance = () => lenisInstance;
