'use client'
import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  Chain
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
// import {sepolia} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

require('dotenv').config();

interface RainbowKitProviderProps {
    children: React.ReactNode;
}

const Arbitrum = {
    id: 421614,
    name: 'Arbitrum Sepolia',
    iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
    iconBackground: '#fff',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
    },
    blockExplorers: {
      default: { name: 'Sepolia Arbiscan', url: 'https://sepolia.arbiscan.io' },
    },
    /*contracts: {
      multicall3: {
        address: '0xca11bde05977b3631167028862be2a173976ca11',
        blockCreated: 11_907_934,
      },
    },*/
  } as const satisfies Chain;
  
    
const config = getDefaultConfig({
    appName: 'Donor Chain',
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
    chains: [Arbitrum],
    ssr: true, 
});

const queryClient = new QueryClient();
const CustomRainbowKitProvider: React.FC<RainbowKitProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
                {children}
            </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
  )
}
export default CustomRainbowKitProvider