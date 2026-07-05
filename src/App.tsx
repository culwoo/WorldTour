import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import CustomCursor from './components/CustomCursor';

// Route-level code splitting: the landing page stays featherweight while the
// heavy WebGL chapters (three.js, GSAP scenes) load on demand.
const WorldTour = lazy(() => import('./pages/WorldTour'));
const Orbit = lazy(() => import('./pages/Orbit'));

function App() {
  return (
    <>
      <CustomCursor />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/world-tour" element={<WorldTour />} />
          <Route path="/orbit" element={<Orbit />} />
          {/* Legacy URL: the section was renamed from Film Journal to Orbit. */}
          <Route path="/film-journal" element={<Navigate to="/orbit" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
