# DonorChain Project

## Overview

DonorChain is a blockchain-based platform designed to bring transparency and efficiency to the process of donating to charities. By leveraging the power of Ethereum blockchain technology through Solidity and the Hardhat development environment, DonorChain ensures that donations are traceable, secure, and directly reach their intended associations without intermediaries.

The front-end of DonorChain is built with Next.js, providing a seamless and responsive user experience. The application is deployed on Vercel, ensuring high availability and performance for users worldwide.

## Features

- **Transparent Donations**: Every transaction is recorded on the blockchain, allowing donors to see exactly where their money is going.
- **Direct Funding**: Donations go directly to the chosen associations, minimizing overhead costs.
- **User-Friendly Interface**: A simple and intuitive interface built with Next.js makes it easy for anyone to donate.
- **Secure Transactions**: Utilizes Ethereum blockchain for secure and immutable transactions.

## Stack

### Backend

- **Solidity**: Smart contract development for handling donations and associations.
- **Hardhat**: Ethereum development environment for compiling, deploying, testing, and debugging the smart contracts.

### Frontend

- **Next.js**: React framework for building the user interface, providing server-side rendering for faster load times and better SEO.
- **Vercel**: Deployment and hosting platform, offering automatic scaling and a global CDN.

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
   cd DonorChain
   npm install
   npm run dev
   ```
   Open http://localhost:3000 in your browser to view the application.

- BACK

```
npx hardhat compile
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

 150 passing (12s)

-----------------------|----------|----------|----------|----------|----------------|
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------------------|----------|----------|----------|----------|----------------|
 contracts\            |      100 |    92.86 |      100 |      100 |                |
  Donation.sol         |      100 |    93.94 |      100 |      100 |                |
  DonationProofSBT.sol |      100 |    88.89 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|
All files              |      100 |    92.86 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|
### License
DonorChain is open source and available under the MIT license.