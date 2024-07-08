"use client";
import React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  Chain,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { arbitrumSepolia } from "@/utils/arbitrumSepolia"

// import {sepolia} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

require("dotenv").config();

interface RainbowKitProviderProps {
  children: React.ReactNode;
}

/*
const RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC || "https://sepolia-rollup.arbitrum.io/rpc";


const arbitrumSepolia = {
  id: 421614,
  name: "Arbitrum Sepolia",
  iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  iconBackground: "#fff",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    // default: { http: ["https://sepolia-rollup.arbitrum.io/rpc"] },
    default: { http: [RPC] },
  },
  blockExplorers: {
    default: { name: "Sepolia Arbiscan", url: "https://sepolia.arbiscan.io" },
  },
  contracts: {
      multicall3: {
        address: '0xcA4e8168ea780ABFe2EAC9d34a6e078156F5cf5a',
        blockCreated: 751532,
      },
    },
} as const satisfies Chain;
 */

const config = getDefaultConfig({
  appName: "Donor Chain",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
  chains: [arbitrumSepolia],
  ssr: true,
});

const queryClient = new QueryClient();
const CustomRainbowKitProvider: React.FC<RainbowKitProviderProps> = ({
  children,
}) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
export default CustomRainbowKitProvider;
