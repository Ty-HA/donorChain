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
        address: '0x808Fd994ED96a66e199f7D9B67C60eeC08b772F4' as `0x${string}`,
        blockCreated: 62705565,
      },
      
    },
    testnet: true,
    estimatedBlockTime: 2,
}