import React, { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLenisInstance } from '../store/lenisStore';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: React.ReactNode;
}

const SmoothScrollWrapper: React.FC<Props> = ({ children }) => {
  useEffect(() => {
    // Disabled normalizeScroll to fix mobile lag "stuttering".
    // While it helps with address bar pinning, it can cause severe scroll jank.
    // ScrollTrigger.normalizeScroll(true);

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Disable Lenis on Mobile to ensure native sticky/fixed behavior works perfectly
    if (isMobile) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      // syncTouch: true, // No need if we disable on mobile
      // touchMultiplier: 0.7,
    });
    setLenisInstance(lenis);

    // Integrate with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick);

    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      // ScrollTrigger.normalizeScroll(false); 
      setLenisInstance(null);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScrollWrapper;
