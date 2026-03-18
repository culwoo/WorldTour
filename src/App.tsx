import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import WorldTour from './pages/WorldTour';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/world-tour" element={<WorldTour />} />
    </Routes>
  );
}

export default App;
