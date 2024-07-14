require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config()

const config = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts",
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    }
  }
};

if (process.env.ARBISCAN_API_KEY) {
  config.etherscan = { apiKey: process.env.ARBISCAN_API_KEY };
  config.sourcify = { enabled: true };
}

if (process.env.ARBITRUM_SEPOLIA_RPC_URL && process.env.PRIVATE_KEY) {
  config.networks.arbitrumSepolia = {
    url: process.env.ARBITRUM_SEPOLIA_RPC_URL,
    accounts: [`0x${process.env.PRIVATE_KEY}`],
    chainId: 421614
  };
}

module.exports = config;