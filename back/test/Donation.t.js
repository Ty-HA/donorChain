const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Donation", function () {
  async function deployDonationFixture() {
    const [owner, asso1, donor1, donor2] = await ethers.getSigners();

    // Deploy DonationProofSBT first
    const DonationProofSBT = await ethers.getContractFactory("DonationProofSBT");
    const sbt = await DonationProofSBT.deploy();
    // Wait for the transaction to be mined
    await sbt.waitForDeployment();

    // Get the address of the deployed SBT contract
    const sbtAddress = await sbt.getAddress();
    console.log("SBT contract deployed at:", sbtAddress);

    // Now deploy Donation with the SBT contract address
    const Donation = await ethers.getContractFactory("Donation");
    const donation = await Donation.deploy(sbtAddress);
    // Wait for the transaction to be mined
    await donation.waitForDeployment();

    // Get the address of the deployed Donation contract
    const donationAddress = await donation.getAddress();
    console.log("Donation contract deployed at:", donationAddress);

    // Set the Donation contract address in the SBT contract
    await sbt.setDonationContract(donationAddress);

    return { donation, sbt, owner, asso1, donor1, donor2 };
  }

  it("should deploy the Donation contract successfully", async function () {
    const { donation, sbt } = await loadFixture(deployDonationFixture);
    
    const donationAddress = await donation.getAddress();
    expect(donationAddress).to.be.properAddress;
    console.log("Donation contract verified at:", donationAddress);
    
    // Verify that the SBT contract address is correctly set
    const sbtAddress = await donation.sbtContract();
    expect(sbtAddress).to.equal(await sbt.getAddress());
    console.log("SBT contract address correctly set in Donation contract");
  });

  // You can add more test cases here
});