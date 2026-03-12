import { createContext, useContext, useState, type ReactNode } from 'react';
import { createWalletClient, custom } from 'viem';
import { somniaTestnet } from '../lib/chain';

interface WalletContextType {
  account: `0x${string}` | null;
  walletClient: any;
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  walletClient: null,
  connect: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<any>(null);

  const connect = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert('Please install a Web3 wallet.');
        return;
      }
      const client = createWalletClient({
        chain: somniaTestnet,
        transport: custom(ethereum),
      });
      const [address] = await client.requestAddresses();
      setAccount(address);
      setWalletClient(client);
    } catch (err) {
      console.error('Wallet connect error:', err);
    }
  };

  return (
    <WalletContext.Provider value={{ account, walletClient, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
