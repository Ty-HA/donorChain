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
        address: '0xcA4e8168ea780ABFe2EAC9d34a6e078156F5cf5a' as `0x${string}`,
        blockCreated: 751532,
      },
      
    },
    testnet: true,
}