import { createContext, useContext, type ReactNode } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface WalletContextType {
  account: `0x${string}` | null;
  walletClient: any;
  connect: () => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  walletClient: null,
  connect: () => {},
  isConnecting: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  // Only treat as connected when status is exactly 'connected'.
  // During 'reconnecting' wagmi briefly exposes an address while trying to
  // restore a cached session — this causes the connect button to flash
  // visible/hidden on every page load. Checking status prevents that.
  const { address, status } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();

  const account: `0x${string}` | null =
    status === 'connected' ? (address ?? null) : null;

  const isConnecting = status === 'connecting' || status === 'reconnecting';

  // openConnectModal is synchronous (fire-and-forget). Do NOT wrap in async
  // or add setConnecting state around it — it returns immediately while the
  // modal is still open, causing an instant loading-state flash.
  const connect = () => openConnectModal?.();

  return (
    <WalletContext.Provider value={{ account, walletClient, connect, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
