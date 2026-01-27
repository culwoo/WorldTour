import { useState, useEffect } from 'react';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SmoothScrollWrapper from './components/SmoothScrollWrapper';
import MixedGallery from './components/MixedGallery';
import Scene from './components/Three/Scene';
import ErrorBoundary from './components/ErrorBoundary';
// CustomCursor removed by user request
import Marquee from './components/Marquee';
import SplashScreen from './components/SplashScreen';

function App() {
  const [loading, setLoading] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);

  // Force refresh GSAP on mount and load
  useEffect(() => {
    // 1. On window load (all assets loaded)
    const handleLoad = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('load', handleLoad);

    // 2. Periodic checks for the first few seconds (fallback for slow images)
    const interval = setInterval(() => {
      ScrollTrigger.refresh();
    }, 1000);

    // Clear interval after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // When loading finishes (Splash done), force refresh again AND delay heavy scene loading
  useEffect(() => {
    if (!loading) {
      // Small delay to allow DOM to settle after splash removal
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);

      // DELAY loading of heavy gallery assets to prevent initial stutter on home reveal.
      // Wait for the splash exit animation to fully complete + 1.5s of smooth idle time.
      setTimeout(() => {
        setSceneReady(true);
      }, 2000);
    }
  }, [loading]);

  return (
    <div className="app-container">
      {/* CustomCursor removed */}

      {loading && <SplashScreen onComplete={() => setLoading(false)} />}

      {/* WebGL Overlay - Fixed position 
          We mount Scene IMMEDIATELY behind the splash screen.
          This ensures shaders compile and textures upload during the 3.5s wait.
          The splash counter might stutter slightly, but the Home reveal will be butter smooth.
      */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', background: 'transparent' }}>
        <ErrorBoundary fallback={null}>
          <Scene ready={sceneReady} />
        </ErrorBoundary>
      </div>

      {/* Scrollable Content */}
      <div style={{ position: 'relative', zIndex: 10, background: 'transparent' }}>
        <SmoothScrollWrapper>
          <main>
            <header style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <h1 style={{ fontSize: '8vw', fontFamily: '"Playfair Display", serif', mixBlendMode: 'difference', zIndex: 20 }}>
                World Tour
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

export default App;
