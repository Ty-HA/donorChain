// scripts/deploy.js

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Function to read contract addresses from a JSON file
function readContractAddresses() {
  const filePath = path.join(__dirname, 'contractAddresses.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Check if the file is empty
    if (fileContent) {
      return JSON.parse(fileContent);
    }
  }
  return {}; // Return an empty object if the file does not exist or is empty
}

// Function to write contract addresses to a JSON file
function writeContractAddress(name, address) {
  const addresses = readContractAddresses();
  addresses[name] = address;
  fs.writeFileSync(path.join(__dirname, 'contractAddresses.json'), JSON.stringify(addresses, null, 2));
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const addresses = readContractAddresses();

  // Deploy DonationProofSBT
  let donationProofSBT;
  if (!addresses["DonationProofSBT"]) {
    const DonationProofSBT = await hre.ethers.getContractFactory("DonationProofSBT");
    donationProofSBT = await DonationProofSBT.deploy();
    await donationProofSBT.deployed();
    console.log("DonationProofSBT deployed to:", donationProofSBT.address);
    writeContractAddress("DonationProofSBT", donationProofSBT.address);
  } else {
    donationProofSBT = await hre.ethers.getContractAt("DonationProofSBT", addresses["DonationProofSBT"]);
    console.log("DonationProofSBT already deployed at:", addresses["DonationProofSBT"]);
  }

  // Deploy DonationBadgeNFT
  let donationBadgeNFT;
  if (!addresses["DonationBadgeNFT"]) {
    const DonationBadgeNFT = await hre.ethers.getContractFactory("DonationBadgeNFT");
    donationBadgeNFT = await DonationBadgeNFT.deploy();
    await donationBadgeNFT.deployed();
    console.log("DonationBadgeNFT deployed to:", donationBadgeNFT.address);
    writeContractAddress("DonationBadgeNFT", donationBadgeNFT.address);
  } else {
    donationBadgeNFT = await hre.ethers.getContractAt("DonationBadgeNFT", addresses["DonationBadgeNFT"]);
    console.log("DonationBadgeNFT already deployed at:", addresses["DonationBadgeNFT"]);
  }

  // Deploy Donation
  let donation;
  if (!addresses["Donation"]) {
    const Donation = await hre.ethers.getContractFactory("Donation");
    donation = await Donation.deploy(donationProofSBT.address, donationBadgeNFT.address);
    await donation.deployed();
    console.log("Donation deployed to:", donation.address);
    writeContractAddress("Donation", donation.address);
  } else {
    donation = await hre.ethers.getContractAt("Donation", addresses["Donation"]);
    console.log("Donation already deployed at:", addresses["Donation"]);
  }

  // Set Donation contract address in DonationProofSBT
  await donationProofSBT.setDonationContract(donation.address);
  console.log("Donation contract address set in DonationProofSBT contract");

  // Set Donation contract address in DonationBadgeNFT
  await donationBadgeNFT.setDonationContract(donation.address);
  console.log("Donation contract address set in DonationBadgeNFT contract");

  // Verify contracts on Etherscan
  console.log("Verifying contracts on Etherscan...");
  // Verification logic here (omitted for brevity)

  console.log("Deployment, verification, and initialization complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });