require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config()

const ARBITRUM_SEPOLIA_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "";
console.log("RPC URL: ", ARBITRUM_SEPOLIA_RPC_URL);
const PK = process.env.PRIVATE_KEY || "";
const ARBISCAN = process.env.ARBISCAN_API_KEY || "";

module.exports = {
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
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL,
      accounts: [`0x${PK}`],
      chainId: 421614
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    }
  },
  etherscan: {
    apiKey: ARBISCAN
  },
};