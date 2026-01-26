import { useState } from 'react';
import SmoothScrollWrapper from './components/SmoothScrollWrapper';
import MixedGallery from './components/MixedGallery';
import Scene from './components/Three/Scene';
import ErrorBoundary from './components/ErrorBoundary';
import CustomCursor from './components/CustomCursor';
import Marquee from './components/Marquee';
import SplashScreen from './components/SplashScreen';

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="app-container">
      <CustomCursor />

      {loading && <SplashScreen onComplete={() => setLoading(false)} />}

      {/* WebGL Overlay - Fixed position 
          We mount Scene IMMEDIATELY behind the splash screen.
          This ensures shaders compile and textures upload during the 3.5s wait.
          The splash counter might stutter slightly, but the Home reveal will be butter smooth.
      */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', background: 'transparent' }}>
        <ErrorBoundary fallback={null}>
          <Scene />
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
              <p style={{ marginTop: '1rem', opacity: 0.6, fontSize: '1.2rem' }}>Collection 2026</p>
            </header>

            <Marquee text="Discover the hidden beauty of the world • " direction="left" />

            <div style={{ minHeight: '100vh', position: 'relative', zIndex: 10 }}>
              <MixedGallery />
            </div>

            <Marquee text="Keep exploring • Live the moment • " direction="right" speed={25} />

            <footer style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '4rem', fontFamily: '"Playfair Display", serif' }}>Thank You</h2>
              <p>© 2026 Interactive Anthology</p>
            </footer>
          </main>
        </SmoothScrollWrapper>
      </div>
    </div>
  );
}

export default App;
