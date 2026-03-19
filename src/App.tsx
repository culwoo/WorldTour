import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import WorldTour from './pages/WorldTour';
import CustomCursor from './components/CustomCursor';

function App() {
  return (
    <>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/world-tour" element={<WorldTour />} />
      </Routes>
    </>
  );
}

export default App;
