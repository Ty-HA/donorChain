// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy DonationProofSBT
  const DonationProofSBT = await hre.ethers.getContractFactory("DonationProofSBT");
  const donationProofSBT = await DonationProofSBT.deploy();
  await donationProofSBT.waitForDeployment();
  console.log("DonationProofSBT deployed to:", await donationProofSBT.getAddress());

  // Deploy DonationBadgeNFT
  const DonationBadgeNFT = await hre.ethers.getContractFactory("DonationBadgeNFT");
  const donationBadgeNFT = await DonationBadgeNFT.deploy();
  await donationBadgeNFT.waitForDeployment();
  console.log("DonationBadgeNFT deployed to:", await donationBadgeNFT.getAddress());

  // Deploy Donation with SBT and Badge addresses
  const Donation = await hre.ethers.getContractFactory("Donation");
  const donation = await Donation.deploy(await donationProofSBT.getAddress(), await donationBadgeNFT.getAddress());
  await donation.waitForDeployment();
  console.log("Donation deployed to:", await donation.getAddress());

  // Set Donation contract address in DonationProofSBT
  await donationProofSBT.setDonationContract(await donation.getAddress());
  console.log("Donation contract address set in DonationProofSBT contract");

  // Set Donation contract address in DonationBadgeNFT
  await donationBadgeNFT.setDonationContract(await donation.getAddress());
  console.log("Donation contract address set in DonationBadgeNFT contract");

  // Verify contracts on Etherscan
  console.log("Verifying contracts on Etherscan...");

  await hre.run("verify:verify", {
    address: await donationProofSBT.getAddress(),
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: await donationBadgeNFT.getAddress(),
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: await donation.getAddress(),
    constructorArguments: [await donationProofSBT.getAddress(), await donationBadgeNFT.getAddress()],
  });

  console.log("Contracts verified on Etherscan");

  // Verify that all configurations are set correctly
  const sbtContractInDonation = await donation.sbtContract();
  const badgeContractInDonation = await donation.badgeContract();
  const donationContractInSBT = await donationProofSBT.donationContract();
  const donationContractInBadge = await donationBadgeNFT.donationContract();

  console.log("Verification:");
  console.log("SBT contract in Donation:", sbtContractInDonation);
  console.log("Badge contract in Donation:", badgeContractInDonation);
  console.log("Donation contract in SBT:", donationContractInSBT);
  console.log("Donation contract in Badge:", donationContractInBadge);

  if (
    sbtContractInDonation === await donationProofSBT.getAddress() &&
    badgeContractInDonation === await donationBadgeNFT.getAddress() &&
    donationContractInSBT === await donation.getAddress() &&
    donationContractInBadge === await donation.getAddress()
  ) {
    console.log("All addresses are correctly set!");
  } else {
    console.error("There's a mismatch in the contract addresses!");
  }

  console.log("Deployment, verification, and initialization complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });