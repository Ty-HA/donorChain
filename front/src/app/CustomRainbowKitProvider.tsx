"use client";
import React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { arbitrumSepolia } from "@/utils/arbitrumSepolia"

// import {sepolia} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

require("dotenv").config();

interface RainbowKitProviderProps {
  children: React.ReactNode;
}

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
