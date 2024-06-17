import { createPublicClient, http } from "viem";
import { Chain } from "@rainbow-me/rainbowkit";
import { hardhat, sepolia} from 'viem/chains';

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
    });