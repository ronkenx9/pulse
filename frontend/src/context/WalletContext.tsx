import { createContext, useContext, type ReactNode } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface WalletContextType {
  account: `0x${string}` | null;
  walletClient: any;
  isConnecting: boolean;
  connect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  walletClient: null,
  isConnecting: false,
  connect: () => { },
});

export function WalletProvider({ children }: { children: ReactNode }) {
  // Only treat as connected when status is strictly 'connected'.
  // 'reconnecting' emits a valid address while wagmi tries to restore a prior
  // session — if the RPC is slow this causes the button to flicker visible/hidden.
  const { address, status } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();

  const account: `0x${string}` | null =
    status === 'connected' ? (address ?? null) : null;

  const isConnecting = status === 'connecting' || status === 'reconnecting';

  // openConnectModal is fire-and-forget (returns void). Keep connect() synchronous
  // so callers don't try to await it and accidentally fire setConnecting(false)
  // before the modal even opens.
  const connect = () => {
    openConnectModal?.();
  };

  return (
    <WalletContext.Provider value={{ account, walletClient, isConnecting, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
