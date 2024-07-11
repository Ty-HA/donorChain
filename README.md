# DonorChain Project
https://donor-chain.vercel.app/

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


# Stack

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
Deploying contracts with the account: 0x8E9B6101776469f4F5e57d509fee35751dBbA54A
DonationProofSBT deployed to: 0xeF5e619946af35a452c83D2DaA080612143CcA87
DonationBadgeNFT deployed to: 0x3fFaD9C8F66fe16C3C047B1DEfb9B54c4E57AB95
Donation deployed to: 0x808Fd994ED96a66e199f7D9B67C60eeC08b772F4
Donation contract address set in DonationProofSBT contract
Donation contract address set in DonationBadgeNFT contract
Verifying contracts on Arbiscan...
Successfully submitted source code for contract
contracts/DonationProofSBT.sol:DonationProofSBT at 0xeF5e619946af35a452c83D2DaA080612143CcA87
for verification on the block explorer. Waiting for verification result...

Successfully verified contract DonationProofSBT on the block explorer.
https://sepolia.arbiscan.io/address/0xeF5e619946af35a452c83D2DaA080612143CcA87#code

Successfully submitted source code for contract
contracts/DonationBadgeNFT.sol:DonationBadgeNFT at 0x3fFaD9C8F66fe16C3C047B1DEfb9B54c4E57AB95
for verification on the block explorer. Waiting for verification result...

Successfully verified contract DonationBadgeNFT on the block explorer.
https://sepolia.arbiscan.io/address/0x3fFaD9C8F66fe16C3C047B1DEfb9B54c4E57AB95#code

Successfully submitted source code for contract
contracts/Donation.sol:Donation at 0x808Fd994ED96a66e199f7D9B67C60eeC08b772F4
for verification on the block explorer. Waiting for verification result...

Successfully verified contract Donation on the block explorer.
https://sepolia.arbiscan.io/address/0x808Fd994ED96a66e199f7D9B67C60eeC08b772F4#code

Contracts verified on Arbiscan
Verification:
SBT contract in Donation: 0xeF5e619946af35a452c83D2DaA080612143CcA87
Badge contract in Donation: 0x3fFaD9C8F66fe16C3C047B1DEfb9B54c4E57AB95
Donation contract in SBT: 0x808Fd994ED96a66e199f7D9B67C60eeC08b772F4
Donation contract in Badge: 0x808Fd994ED96a66e199f7D9B67C60eeC08b772F4
All addresses are correctly set!
Deployment, verification, and initialization complete!
```
Check the deployed smart contracts here:
Donation
https://sepolia.arbiscan.io/address/0x808Fd994ED96a66e199f7D9B67C60eeC08b772F4#code
DonationProofSBT
https://sepolia.arbiscan.io/address/0xeF5e619946af35a452c83D2DaA080612143CcA87#code
DonationBadgeNFT
https://sepolia.arbiscan.io/address/0x3fFaD9C8F66fe16C3C047B1DEfb9B54c4E57AB95#code



## Smart contracts

### Units tests
How to running test
```
cd DonorChain/back
npx hardhat compile
npx hardhat test
npx hardhat coverage
```
#### Example
```
describe("donateToAssociation", function () {
it("should not allow donation to non-whitelisted association", async function () {
      const { donation, asso2, donor1 } = await loadFixture(
        deployDonationFixture
      );
      const donationAmount = ethers.parseEther("1");
      await expect(
        donation
          .connect(donor1)
          .donateToAssociation(asso2.address, donationAmount, {
            value: donationAmount,
          })
      ).to.be.revertedWith("Association is not whitelisted");
    });
})
```
```
donateToAssociation
      ✔ should allow a donor to make a donation (210ms)
      ✔ should not allow donation if sent amount does not match specified amount (38ms)
      ✔ should not allow donation to non-whitelisted association (40ms)
      ✔ should not allow association to donate to itself (43ms)
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
## Security
To ensure the security of the smart contracts, we use the Slither static analysis tool. Slither helps to identify potential vulnerabilities in the smart contracts.

To run Slither on the DonationBadgeNFT.sol contract, use the following command:
```
slither contracts/DonationBadgeNFT.sol --json rapportDonationBadgeNFT.json --solc-remaps "@openzeppelin=node_modules/@openzeppelin"
```
This command will generate a JSON report (reportDonationBadgeNFT.json) with the analysis results.

Importing Reentrancy Guard
We use OpenZeppelin's ReentrancyGuard to protect against reentrancy attacks. Ensure that you have imported the guard in your contracts:
```
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
```






### License
DonorChain is open source and available under the MIT license.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Disclaimer
This Decentralized Application (DApp) was developed as part of a school project. It is deployed on the Arbitrum Sepolia testnet. The authors are not responsible for any losses or damages resulting from the use of this application.
