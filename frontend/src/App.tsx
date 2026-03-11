import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Duel } from './pages/Duel';
import { Leaderboard } from './pages/Leaderboard';

function App() {
  return (
    <>
      <div className="crt-overlay"></div>
      <div className="crt-noise"></div>
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/duel" element={<Duel />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
