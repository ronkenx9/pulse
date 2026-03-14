import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Provider';
import { WalletProvider } from './context/WalletContext';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Duel } from './pages/Duel';
import { Leaderboard } from './pages/Leaderboard';
import { Practice } from './pages/Practice';
import { HeartbeatLine } from './components/HeartbeatLine';
import { ImmersiveBackground } from './components/ImmersiveBackground';

function App() {
  return (
    <Web3Provider>
      <WalletProvider>
        <ImmersiveBackground />
        <HeartbeatLine />

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby" element={<Lobby />} />
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
