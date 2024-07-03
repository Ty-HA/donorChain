// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy DonationProofSBT
  const DonationProofSBT = await hre.ethers.getContractFactory("DonationProofSBT");
  const donationProofSBT = await DonationProofSBT.deploy();
  await donationProofSBT.deployed();

  console.log("DonationProofSBT deployed to:", donationProofSBT.address);

  // Deploy Donation
  const Donation = await hre.ethers.getContractFactory("Donation");
  const donation = await Donation.deploy();
  await donation.deployed();

  console.log("Donation deployed to:", donation.address);

  // Set DonationProofSBT address in Donation contract
  await donation.setSBTContract(donationProofSBT.address);
  console.log("SBT contract address set in Donation contract");

  // Set Donation contract address in DonationProofSBT
  await donationProofSBT.setDonationContract(donation.address);
  console.log("Donation contract address set in DonationProofSBT contract");

  console.log("Deployment and initialization complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });