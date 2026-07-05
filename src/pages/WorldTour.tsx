import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SmoothScrollWrapper from '../components/SmoothScrollWrapper';
import MixedGallery from '../components/MixedGallery';
import Scene from '../components/Three/Scene';
import ErrorBoundary from '../components/ErrorBoundary';
import Marquee from '../components/Marquee';
import SplashScreen from '../components/SplashScreen';
import FilmGrain from '../components/FilmGrain';
import Lightbox from '../components/Lightbox';
import { startScrollTracker } from '../utils/scrollTracker';


function WorldTour() {
  const [loading, setLoading] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Start the global scroll-velocity tracker that drives the gallery warp.
  useEffect(() => {
    startScrollTracker();
  }, []);

  // Cinematic title reveal once the splash lifts.
  useEffect(() => {
    if (loading || !titleRef.current) return;
    const letters = titleRef.current.querySelectorAll('span');
    gsap.fromTo(
      letters,
      { yPercent: 120, opacity: 0, rotateX: -70 },
      {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.05,
        delay: 0.15,
      },
    );
  }, [loading]);

  // Warm up WebGL assets behind the splash to avoid post-splash hitching.
  useEffect(() => {
    const warmupTimer = window.setTimeout(() => {
      setSceneReady(true);
    }, 100);

    // SAFETY FALLBACK: Force loading to end after 8 seconds max
    const safetyTimer = window.setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => {
      window.clearTimeout(warmupTimer);
      window.clearTimeout(safetyTimer);
    };
  }, []);

  // Force refresh GSAP on mount and load
  useEffect(() => {
    const handleLoad = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('load', handleLoad);

    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    const safetyTimeout = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1200);

    return () => {
      window.removeEventListener('load', handleLoad);
      cancelAnimationFrame(rafId);
      window.clearTimeout(safetyTimeout);
    };
  }, []);

  // When loading finishes, force refresh again
  useEffect(() => {
    if (!loading) {
      const refreshA = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
      const refreshB = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);

      return () => {
        window.clearTimeout(refreshA);
        window.clearTimeout(refreshB);
      };
    }
  }, [loading]);

  // Lock page scroll only while splash is visible.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    if (loading) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [loading]);

  // Cleanup ScrollTrigger instances on unmount to prevent stale triggers
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="app-container">

      {loading && <SplashScreen onComplete={() => setLoading(false)} />}

      {/* Film grain + vignette over the whole page */}
      <FilmGrain />

      {/* Click-to-expand lightbox (renders only when a photo is focused) */}
      <Lightbox />

      {/* WebGL Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0, pointerEvents: 'none', background: 'transparent' }}>
        <ErrorBoundary fallback={null}>
          <Scene ready={sceneReady} />
        </ErrorBoundary>
      </div>

      {/* Scrollable Content */}
      <div style={{ position: 'relative', zIndex: 10, background: 'transparent', minHeight: '100vh', width: '100%' }}>
        <SmoothScrollWrapper>
          <main>
            {/* Back button */}
            <button
              onClick={() => navigate('/')}
              style={{
                position: 'fixed',
                top: '2rem',
                left: '2rem',
                zIndex: 100,
                background: 'none',
                border: '1px solid rgba(240, 240, 240, 0.15)',
                color: '#f0f0f0',
                padding: '0.6rem 1.2rem',
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                borderRadius: '4px',
                transition: 'border-color 0.3s ease, background 0.3s ease',
                mixBlendMode: 'difference',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(240, 240, 240, 0.4)';
                e.currentTarget.style.background = 'rgba(240, 240, 240, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(240, 240, 240, 0.15)';
                e.currentTarget.style.background = 'none';
              }}
            >
              &larr; Back
            </button>

            <header style={{
              height: '100dvh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <h1
                ref={titleRef}
                style={{
                  fontSize: '8vw',
                  fontFamily: '"Playfair Display", serif',
                  mixBlendMode: 'difference',
                  zIndex: 20,
                  display: 'flex',
                  perspective: '600px',
                }}
              >
                {'World Tour'.split('').map((c, i) => (
                  <span
                    key={i}
                    style={{ display: 'inline-block', whiteSpace: 'pre', transformStyle: 'preserve-3d' }}
                  >
                    {c}
                  </span>
                ))}
              </h1>
            </header>

            <Marquee text="LifeOfKwak • " direction="left" />

            <div style={{ minHeight: '100vh', position: 'relative', zIndex: 10 }}>
              <MixedGallery />
            </div>

            <Marquee text="LifeOfKwak • " direction="right" speed={25} />

            <footer style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '4rem', fontFamily: '"Playfair Display", serif' }}>Fin.</h2>
            </footer>
          </main>
        </SmoothScrollWrapper>
      </div>
    </div>
  );
}

export default WorldTour;
