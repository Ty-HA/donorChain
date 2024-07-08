import { createPublicClient, http } from "viem";
import { Chain } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from 'viem/chains';

const RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC || "";

export const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(RPC),
    });