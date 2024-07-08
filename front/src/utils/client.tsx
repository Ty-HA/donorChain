import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from 'viem/chains';

const RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC || "";

export const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(RPC),
    });