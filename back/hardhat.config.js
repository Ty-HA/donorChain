require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config()

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PK = process.env.PRIVATE_KEY || "";
const ETHERSCAN = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts",
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [`0x${PK}`],
      chainId: 11155111
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    }
  },
  etherscan: {
    apiKey: ETHERSCAN
  },
};