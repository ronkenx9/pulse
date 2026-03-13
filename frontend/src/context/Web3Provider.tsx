import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import type { ReactNode } from 'react';
import { somniaTestnet } from '../lib/chain';

const config = getDefaultConfig({
    appName: 'PULSE',
    projectId: 'YOUR_PROJECT_ID', // Optional for now, but good practice
    chains: [somniaTestnet],
    ssr: false,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme({
                    accentColor: '#00FFFF',
                    accentColorForeground: 'black',
                    borderRadius: 'small',
                    fontStack: 'system',
                    overlayBlur: 'small',
                })}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
