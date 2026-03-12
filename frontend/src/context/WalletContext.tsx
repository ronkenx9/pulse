import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
  connect: async () => { },
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<any>(null);

  const setupWallet = async (ethereum: any) => {
    const client = createWalletClient({
      chain: somniaTestnet,
      transport: custom(ethereum),
    });

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${somniaTestnet.id.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${somniaTestnet.id.toString(16)}`,
                chainName: somniaTestnet.name,
                rpcUrls: somniaTestnet.rpcUrls.default.http,
                nativeCurrency: somniaTestnet.nativeCurrency,
                blockExplorerUrls: [somniaTestnet.blockExplorers.default.url],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding chain:', addError);
        }
      }
    }

    const [address] = await client.requestAddresses();
    setAccount(address);
    setWalletClient(client);
    return address;
  };

  const connect = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert('Please install a Web3 wallet.');
      return;
    }
    await setupWallet(ethereum);
  };

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setupWallet(ethereum).catch(console.error);
        }
      });

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0] as `0x${string}`);
        } else {
          setAccount(null);
          setWalletClient(null);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  return (
    <WalletContext.Provider value={{ account, walletClient, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
