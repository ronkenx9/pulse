import { createContext, useContext, type ReactNode } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface WalletContextType {
  account: `0x${string}` | null;
  walletClient: any;
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  walletClient: null,
  connect: async () => { },
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();

  const connect = async () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  return (
    <WalletContext.Provider value={{ account: address || null, walletClient, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
