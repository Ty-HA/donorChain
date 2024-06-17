"use client";
import { contractAddress, contractAbi } from "@/constants";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { parseAbiItem } from "viem";

import { publicClient } from "@/utils/client";

export default function TestSM() {
    const { address, isConnected } = useAccount();
    return (
        <>
            {isConnected ? (
                <div className="min-h-screen">
                    <h2 className="text-black mb-4 font-bold text-xl">USER ACCOUNT</h2>
                    <p className="text-black mb-24">Connected with {address}</p>
                </div>
            ) : (
                <div>
                    <h2 className="text-black mb-4 font-bold text-xl">USER ACCOUNT</h2>
                    <p className="text-black mb-24">Please connect your wallet</p>
                </div>
            )}
        </>
    );
}