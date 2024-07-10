const RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC || "https://sepolia-rollup.arbitrum.io/rpc";

export const arbitrumSepolia = {
    id: 421614,
    name: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: {
        http: [RPC],
      },
    },
    blockExplorers: {
      default: {
        name: 'Arbiscan',
        url: 'https://sepolia.arbiscan.io',
        apiUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      },
    },
    contracts: {
      multicall3: {
        address: '0x523b18de0c95c32459B7dE3F21E93943646Cac4b' as `0x${string}`,
        blockCreated: 62705565,
      },
      
    },
    testnet: true,
    estimatedBlockTime: 2,
}