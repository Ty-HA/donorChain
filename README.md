# DonorChain Project

## Overview

DonorChain is a blockchain-based platform designed to bring transparency and efficiency to the process of donating to charities. By leveraging the power of Ethereum blockchain technology through Solidity and the Hardhat development environment, DonorChain ensures that donations are traceable, secure, and directly reach their intended associations without intermediaries.

The front-end of DonorChain is built with Next.js, providing a seamless and responsive user experience. The application is deployed on Vercel, ensuring high availability and performance for users worldwide.

## Features

- **Transparent Donations**: Every transaction is recorded on the blockchain, allowing donors to see exactly where their money is going.
- **Direct Funding**: Donations go directly to the chosen associations, minimizing overhead costs.
- **User-Friendly Interface**: A simple and intuitive interface built with Next.js makes it easy for anyone to donate.
- **Secure Transactions**: Utilizes Ethereum blockchain for secure and immutable transactions.
- **Rewarding**: Donors receive rewards for their contributions, incentivizing continued support for the causes they care about.
- **Admin dashboard**: An administrative dashboard allows authorized admin to manage and monitor the platform effectively.


## Stack

### Backend

- **Solidity**: Smart contract development for handling donations and associations.
- **Hardhat**: Ethereum development environment for compiling, deploying, testing, and debugging the smart contracts.

### Frontend

- **Next.js**: React framework for building the user interface, providing server-side rendering for faster load times and better SEO.
- **Vercel**: Deployment and hosting platform, offering automatic scaling and a global CDN.
- **Contact**: Using web3form for contact section.

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- MetaMask or any Ethereum wallet for interacting with the dApp

### Setting Up the Development Environment

- FRONT
1. Clone the repository:
   
   ```bash
   git clone <repository-url>
   cd DonorChain/front
   npm install
   npm run dev
   ```
   Open http://localhost:3000 in your browser to view the application.

- BACK

```
cd DonorChain/back
npx hardhat compile
npx hardhat node
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```
Deploy script was written to deploy and verify my 3 contracts

```
Compiled 21 Solidity files successfully (evm target: paris).
Deploying contracts with the account: 0x8E9B6101776469f4F5e57d509fee35751dBbA54A
DonationProofSBT deployed to: 0xBbE0F111A9E9BE1644340370990d029af1E4281A
DonationBadgeNFT deployed to: 0x0298C54F9F2428bE8A536768153fc334e5b68D6b
Donation deployed to: 0x523b18de0c95c32459B7dE3F21E93943646Cac4b
Donation contract address set in DonationProofSBT contract
Donation contract address set in DonationBadgeNFT contract
Verifying contracts on Arbiscan...
Successfully submitted source code for contract
contracts/DonationProofSBT.sol:DonationProofSBT at 0xBbE0F111A9E9BE1644340370990d029af1E4281A
for verification on the block explorer. Waiting for verification result...

Successfully verified contract DonationProofSBT on the block explorer.
https://sepolia.arbiscan.io/address/0xBbE0F111A9E9BE1644340370990d029af1E4281A#code

Successfully submitted source code for contract
contracts/DonationBadgeNFT.sol:DonationBadgeNFT at 0x0298C54F9F2428bE8A536768153fc334e5b68D6b
for verification on the block explorer. Waiting for verification result...

Successfully verified contract DonationBadgeNFT on the block explorer.
https://sepolia.arbiscan.io/address/0x0298C54F9F2428bE8A536768153fc334e5b68D6b#code

Successfully submitted source code for contract
contracts/Donation.sol:Donation at 0x523b18de0c95c32459B7dE3F21E93943646Cac4b
for verification on the block explorer. Waiting for verification result...

Successfully verified contract Donation on the block explorer.
https://sepolia.arbiscan.io/address/0x523b18de0c95c32459B7dE3F21E93943646Cac4b#code

Contracts verified on Arbiscan
Verification:
SBT contract in Donation: 0xBbE0F111A9E9BE1644340370990d029af1E4281A
Badge contract in Donation: 0x0298C54F9F2428bE8A536768153fc334e5b68D6b
Donation contract in SBT: 0x523b18de0c95c32459B7dE3F21E93943646Cac4b
Donation contract in Badge: 0x523b18de0c95c32459B7dE3F21E93943646Cac4b
All addresses are correctly set!
Deployment, verification, and initialization complete!
```
Check the deployed smart contracts here:
https://sepolia.arbiscan.io/address/0x523b18de0c95c32459B7dE3F21E93943646Cac4b#code
https://sepolia.arbiscan.io/address/0xBbE0F111A9E9BE1644340370990d029af1E4281A#code
https://sepolia.arbiscan.io/address/0x0298C54F9F2428bE8A536768153fc334e5b68D6b#code



## Smart contracts

### Units tests
How to running test
```
cd DonorChain/back
npx hardhat compile
npx hardhat test
npx hardhat coverage
```

  233 passing (21s)

-----------------------|----------|----------|----------|----------|----------------|
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------------------|----------|----------|----------|----------|----------------|
 contracts\            |      100 |     87.5 |      100 |      100 |                |
  Donation.sol         |      100 |    92.68 |      100 |      100 |                |
  DonationBadgeNFT.sol |      100 |    84.21 |      100 |      100 |                |
  DonationProofSBT.sol |      100 |    78.13 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|
All files              |      100 |     87.5 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|

### License
DonorChain is open source and available under the MIT license.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Disclaimer
This Decentralized Application (DApp) was developed as part of a school project. It is deployed on the Arbitrum Sepolia testnet. The authors are not responsible for any losses or damages resulting from the use of this application.
