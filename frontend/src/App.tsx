import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Provider';
import { WalletProvider } from './context/WalletContext';
import { Home } from './pages/Home';
import { Duel } from './pages/Duel';
import { Leaderboard } from './pages/Leaderboard';
import { Practice } from './pages/Practice';
import { HeartbeatBar } from './components/HeartbeatBar';

function App() {
  return (
    <Web3Provider>
      <WalletProvider>
        <div className="crt-overlay"></div>
        <div className="crt-noise"></div>

        <BrowserRouter>
          <HeartbeatBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/duel" element={<Duel />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/practice" element={<Practice />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </Web3Provider>
  );
}

export default App;
