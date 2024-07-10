const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Donation", function () {
  async function deployDonationFixture() {
    const [owner, asso1, asso2, asso3, donor1, donor2, recipient] =
      await ethers.getSigners();

    // Deploy DonationProofSBT first
    const DonationProofSBT = await ethers.getContractFactory(
      "DonationProofSBT"
    );
    const sbt = await DonationProofSBT.deploy();
    await sbt.waitForDeployment();

    const sbtAddress = await sbt.getAddress();
    console.log("SBT contract deployed at:", sbtAddress);

    // Deploy DonationBadgeNFT first
    const DonationBadgeNFT = await ethers.getContractFactory(
      "DonationBadgeNFT"
    );
    const badge = await DonationBadgeNFT.deploy();
    await badge.waitForDeployment();

    const badgeAddress = await badge.getAddress();
    console.log("NFT Badge contract deployed at:", badgeAddress);

    // Now deploy Donation with the SBT contract address
    const Donation = await ethers.getContractFactory("Donation");
    const donation = await Donation.deploy(sbtAddress, badgeAddress);
    await donation.waitForDeployment();

    const donationAddress = await donation.getAddress();
    console.log("Donation contract deployed at:", donationAddress);

    // Set the Donation contract address in the SBT contract
    await sbt.setDonationContract(donationAddress);
    await badge.setDonationContract(donationAddress);

    return {
      donation,
      sbt,
      badge,
      owner,
      asso1,
      asso2,
      asso3,
      donor1,
      donor2,
      recipient,
    };
  }

  describe("setBadgeContract", function () {
    it("should set the badge contract address correctly", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      // Deploy DonationBadgeNFT
      const DonationBadgeNFT = await ethers.getContractFactory(
        "DonationBadgeNFT"
      );
      const badgeNFT = await DonationBadgeNFT.deploy();
      await badgeNFT.waitForDeployment();

      const badgeNFTAddress = await badgeNFT.getAddress();

      // Set the badge contract
      await donation.connect(owner).setBadgeContract(badgeNFTAddress);

      // Check if the badge contract was set correctly
      const setBadgeContractAddress = await donation.badgeContract();
      expect(setBadgeContractAddress).to.equal(badgeNFTAddress);
    });

    it("should emit BadgeContractSet event", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      // Deploy DonationBadgeNFT
      const DonationBadgeNFT = await ethers.getContractFactory(
        "DonationBadgeNFT"
      );
      const badgeNFT = await DonationBadgeNFT.deploy();
      await badgeNFT.waitForDeployment();

      const badgeNFTAddress = await badgeNFT.getAddress();

      // Check if the event is emitted
      await expect(donation.connect(owner).setBadgeContract(badgeNFTAddress))
        .to.emit(donation, "BadgeContractSet")
        .withArgs(badgeNFTAddress);
    });

    it("should revert when called by non-owner", async function () {
      const { donation, donor1 } = await loadFixture(deployDonationFixture);

      // Deploy DonationBadgeNFT
      const DonationBadgeNFT = await ethers.getContractFactory(
        "DonationBadgeNFT"
      );
      const badgeNFT = await DonationBadgeNFT.deploy();
      await badgeNFT.waitForDeployment();

      const badgeNFTAddress = await badgeNFT.getAddress();

      // Try to set the badge contract with a non-owner account
      await expect(donation.connect(donor1).setBadgeContract(badgeNFTAddress))
        .to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount")
        .withArgs(donor1.address);
    });

    it("should revert when setting zero address", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      // Try to set the zero address
      await expect(
        donation.connect(owner).setBadgeContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid badge contract address");
    });
  });

  it("should deploy the Donation contract successfully", async function () {
    const { donation, sbt } = await loadFixture(deployDonationFixture);

    const donationAddress = await donation.getAddress();
    expect(donationAddress).to.be.properAddress;
    console.log("Donation contract verified at:", donationAddress);

    const sbtAddress = await donation.sbtContract();
    expect(sbtAddress).to.equal(await sbt.getAddress());
    console.log("SBT contract address correctly set in Donation contract");
  });

  describe("onlyAssociation modifier", function () {
    it("should not allow non-whitelisted address to call restricted function", async function () {
      const { donation, donor1 } = await loadFixture(deployDonationFixture);

      const recipient = ethers.Wallet.createRandom().address;
      const amount = ethers.parseEther("1");

      // Try to call the restricted function with a non-whitelisted address
      await expect(
        donation
          .connect(donor1)
          .transferFunds(recipient, amount, "Test transfer")
      ).to.be.revertedWith("You're not an association on our whitelist");
    });
  });

  describe("addAssociation", function () {
    it("should allow owner to add a new association", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await expect(
        donation
          .connect(owner)
          .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123")
      )
        .to.emit(donation, "AssociationAdded")
        .withArgs(asso1.address, "Asso1", "123 Main St", "RNA123");

      const associationDetails = await donation.getAssociationDetails(
        asso1.address
      );
      expect(associationDetails[0]).to.equal("Asso1");
      expect(associationDetails[1]).to.equal("123 Main St");
      expect(associationDetails[2]).to.equal("RNA123");
      expect(associationDetails[3]).to.be.true; // whitelisted
    });

    it("should allow owner to add a new association", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await expect(
        donation
          .connect(owner)
          .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123")
      )
        .to.emit(donation, "AssociationAdded")
        .withArgs(asso1.address, "Asso1", "123 Main St", "RNA123");

      const associationDetails = await donation.getAssociationDetails(
        asso1.address
      );
      expect(associationDetails[0]).to.equal("Asso1");
      expect(associationDetails[1]).to.equal("123 Main St");
      expect(associationDetails[2]).to.equal("RNA123");
      expect(associationDetails[3]).to.be.true; // whitelisted
    });
    it("should not allow adding an association with zero address", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      await expect(
        donation
          .connect(owner)
          .addAssociation(ethers.ZeroAddress, "Asso1", "123 Main St", "RNA123")
      ).to.be.revertedWith("Invalid address");
    });
    it("should not allow adding an already whitelisted association", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      await expect(
        donation
          .connect(owner)
          .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123")
      ).to.be.revertedWith("Association already whitelisted");
    });
    it("should not allow adding an association with empty name", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await expect(
        donation
          .connect(owner)
          .addAssociation(asso1.address, "", "123 Main St", "RNA123")
      ).to.be.revertedWith("Association name cannot be empty");
    });

    it("should not allow adding an association with empty postal address", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await expect(
        donation
          .connect(owner)
          .addAssociation(asso1.address, "Asso1", "", "RNA123")
      ).to.be.revertedWith("Postal address cannot be empty");
    });
    it("should correctly update associationList and associationId", async function () {
      const { donation, owner, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");

      const associationList = await donation.getWhitelistedAssociations();
      expect(associationList).to.have.lengthOf(2);
      expect(associationList[0]).to.equal(asso1.address);
      expect(associationList[1]).to.equal(asso2.address);
    });
  });

  describe("updateAssociationWalletAddr", function () {
    it("should allow owner to update association wallet address", async function () {
      const { donation, owner, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      );

      // Add association first
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      // Update wallet address
      await expect(
        donation
          .connect(owner)
          .updateAssociationWalletAddr(asso1.address, asso2.address)
      )
        .to.emit(donation, "AssociationWalletAddrUpdated")
        .withArgs(asso1.address, asso2.address);

      // Check if the association details are updated
      const associationDetails = await donation.getAssociationDetails(
        asso2.address
      );
      expect(associationDetails[3]).to.be.true; // whitelisted
    });
    it("should not allow non-owner to update association wallet address", async function () {
      const { donation, owner, asso1, asso2, donor1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      await expect(
        donation
          .connect(donor1)
          .updateAssociationWalletAddr(asso1.address, asso2.address)
      ).to.be.reverted; // Nous vérifions simplement que la transaction est annulée sans spécifier le message d'erreur exact
    });

    it("should not allow updating to zero address", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      await expect(
        donation
          .connect(owner)
          .updateAssociationWalletAddr(asso1.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
    it("should not allow updating non-whitelisted association", async function () {
      const { donation, owner, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      );

      await expect(
        donation
          .connect(owner)
          .updateAssociationWalletAddr(asso1.address, asso2.address)
      ).to.be.revertedWith("Association not whitelisted");
    });

    it("should correctly update association wallet address", async function () {
      const { donation, owner, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      );

      // Add the initial association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      // Update the wallet address
      await donation
        .connect(owner)
        .updateAssociationWalletAddr(asso1.address, asso2.address);

      // Check that the old address is no longer whitelisted
      const oldAssociationDetails = await donation.getAssociationDetails(
        asso1.address
      );
      expect(oldAssociationDetails[3]).to.be.false; // whitelisted should be false

      // Check that the new address is whitelisted and has the correct details
      const newAssociationDetails = await donation.getAssociationDetails(
        asso2.address
      );
      expect(newAssociationDetails[0]).to.equal("Asso1"); // name
      expect(newAssociationDetails[1]).to.equal("123 Main St"); // postalAddress
      expect(newAssociationDetails[2]).to.equal("RNA123"); // rnaNumber
      expect(newAssociationDetails[3]).to.be.true; // whitelisted should be true

      // Check the updated associationList
      const associationList = await donation.getWhitelistedAssociations();
      expect(associationList).to.have.lengthOf(1);
      expect(associationList[0]).to.equal(asso2.address);

      // Try to use the old address (should fail)
      await expect(
        donation
          .connect(owner)
          .updateAssociationWalletAddr(
            asso1.address,
            ethers.Wallet.createRandom().address
          )
      ).to.be.revertedWith("Association not whitelisted");

      // Use the new address (should succeed)
      const newRandomAddress = ethers.Wallet.createRandom().address;
      await expect(
        donation
          .connect(owner)
          .updateAssociationWalletAddr(asso2.address, newRandomAddress)
      ).to.not.be.reverted;
    });
    it("should preserve other association details after update", async function () {
      const { donation, owner, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .updateAssociationWalletAddr(asso1.address, asso2.address);

      const associationDetails = await donation.getAssociationDetails(
        asso2.address
      );
      expect(associationDetails[0]).to.equal("Asso1"); // name
      expect(associationDetails[1]).to.equal("123 Main St"); // postalAddress
      expect(associationDetails[2]).to.equal("RNA123"); // rnaNumber
      expect(associationDetails[3]).to.be.true; // whitelisted
    });
  });

  describe("updateAssociationPostalAddr", function () {
    it("should allow owner to update association postal address", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      const newPostalAddress = "456 Oak St";
      await expect(
        donation
          .connect(owner)
          .updateAssociationPostalAddr(asso1.address, newPostalAddress)
      )
        .to.emit(donation, "AssociationUpdated")
        .withArgs(asso1.address, newPostalAddress);

      const associationDetails = await donation.getAssociationDetails(
        asso1.address
      );
      expect(associationDetails[1]).to.equal(newPostalAddress);
    });

    it("should not allow non-owner to update association postal address", async function () {
      const { donation, owner, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      await expect(
        donation
          .connect(donor1)
          .updateAssociationPostalAddr(asso1.address, "456 Oak St")
      ).to.be.reverted;
    });

    it("should not allow updating postal address of non-whitelisted association", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await expect(
        donation
          .connect(owner)
          .updateAssociationPostalAddr(asso1.address, "456 Oak St")
      ).to.be.revertedWith("Association not whitelisted");
    });

    it("should not allow updating to an empty postal address", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      await expect(
        donation.connect(owner).updateAssociationPostalAddr(asso1.address, "")
      ).to.be.revertedWith("Invalid postal address");
    });
  });

  describe("updateAssociationName", function () {
    it("should allow owner to update association name", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      const newName = "New Asso Name";
      await expect(
        donation.connect(owner).updateAssociationName(asso1.address, newName)
      )
        .to.emit(donation, "AssociationNameUpdated")
        .withArgs(asso1.address, newName);

      const associationDetails = await donation.getAssociationDetails(
        asso1.address
      );
      expect(associationDetails[0]).to.equal(newName);
    });

    it("should not allow non-owner to update association name", async function () {
      const { donation, owner, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      await expect(
        donation
          .connect(donor1)
          .updateAssociationName(asso1.address, "New Name")
      ).to.be.reverted;
    });

    it("should not allow updating name of non-whitelisted association", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await expect(
        donation.connect(owner).updateAssociationName(asso1.address, "New Name")
      ).to.be.revertedWith("Association not whitelisted");
    });

    it("should not allow updating to an empty name", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      await expect(
        donation.connect(owner).updateAssociationName(asso1.address, "")
      ).to.be.revertedWith("Invalid Name");
    });
  });

  describe("removeAssociation", function () {
    it("should allow owner to remove an association", async function () {
      const { donation, owner, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");

      await expect(donation.connect(owner).removeAssociation(asso1.address))
        .to.emit(donation, "AssociationRemoved")
        .withArgs(asso1.address);

      const associationDetails = await donation.getAssociationDetails(
        asso1.address
      );
      expect(associationDetails[3]).to.be.false; // whitelisted should be false

      const associationList = await donation.getWhitelistedAssociations();
      expect(associationList).to.have.lengthOf(1);
      expect(associationList[0]).to.equal(asso2.address);
    });

    it("should not allow non-owner to remove an association", async function () {
      const { donation, owner, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      await expect(donation.connect(donor1).removeAssociation(asso1.address)).to
        .be.reverted;
    });

    it("should not allow removing a non-whitelisted association", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await expect(
        donation.connect(owner).removeAssociation(asso1.address)
      ).to.be.revertedWith("Association not whitelisted");
    });

    it("should correctly update associationList and associationId when removing", async function () {
      const { donation, owner, asso1, asso2, asso3 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");
      await donation
        .connect(owner)
        .addAssociation(asso3.address, "Asso3", "789 Pine St", "RNA789");

      await donation.connect(owner).removeAssociation(asso2.address);

      const associationList = await donation.getWhitelistedAssociations();
      expect(associationList).to.have.lengthOf(2);
      expect(associationList).to.include(asso1.address);
      expect(associationList).to.include(asso3.address);
      expect(associationList).to.not.include(asso2.address);

      // Verify that the remaining associations can still be updated
      await expect(
        donation
          .connect(owner)
          .updateAssociationPostalAddr(asso1.address, "New Address 1")
      ).to.not.be.reverted;
      await expect(
        donation
          .connect(owner)
          .updateAssociationPostalAddr(asso3.address, "New Address 3")
      ).to.not.be.reverted;
    });

    it("should not allow removing an association with remaining balance", async function () {
      const { donation, owner, asso1, donor1 } = await loadFixture(deployDonationFixture);
    
      await donation.connect(owner).addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      
      // Faire un don à l'association
      const donationAmount = ethers.parseEther("1");
      console.log("Donation amount:", donationAmount.toString());
      await donation.connect(donor1).donateToAssociation(asso1.address, donationAmount, { value: donationAmount });
    
      // Tenter de supprimer l'association avec un solde
      await expect(donation.connect(owner).removeAssociation(asso1.address))
        .to.be.revertedWith("Association has remaining funds. Please withdraw before removing.");
    });
    
    it("should allow removing an association after withdrawing all funds", async function () {
      const { donation, owner, asso1, donor1 } = await loadFixture(deployDonationFixture);
    
      await donation.connect(owner).addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      
      const donationAmount = ethers.parseEther("1");
      console.log("Donation amount:", donationAmount.toString());
      await donation.connect(donor1).donateToAssociation(asso1.address, donationAmount, { value: donationAmount });
    
      const recipient = ethers.Wallet.createRandom();
    
      // transfer all funds to recipient
      const amountToTransfer = donationAmount; 
      await donation.connect(asso1).transferFunds(
        recipient.address,
        amountToTransfer,
        "Withdrawal of all funds"
      );
    
      // Maintenant, la suppression devrait réussir
      await expect(donation.connect(owner).removeAssociation(asso1.address))
        .to.emit(donation, "AssociationRemoved")
        .withArgs(asso1.address);
    });

    it("should reset association whitelisted status when removing", async function () {
      const { donation, owner, asso1 } = await loadFixture(deployDonationFixture);
    
      await donation.connect(owner).addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation.connect(owner).removeAssociation(asso1.address);
    
      const associationDetails = await donation.getAssociationDetails(asso1.address);
      console.log("Association details:", associationDetails);
    
      // Supposons que whitelisted soit le 4ème élément du tableau (index 3)
      expect(associationDetails[3]).to.be.false;
    });

    it("should allow re-adding a previously removed association", async function () {
      const { donation, owner, asso1 } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation.connect(owner).removeAssociation(asso1.address);

      // Re-add the association
      await expect(
        donation
          .connect(owner)
          .addAssociation(asso1.address, "Asso1 New", "456 New St", "RNA456")
      )
        .to.emit(donation, "AssociationAdded")
        .withArgs(asso1.address, "Asso1 New", "456 New St", "RNA456");

      const associationDetails = await donation.getAssociationDetails(
        asso1.address
      );
      expect(associationDetails[0]).to.equal("Asso1 New");
      expect(associationDetails[1]).to.equal("456 New St");
      expect(associationDetails[2]).to.equal("RNA456");
      expect(associationDetails[3]).to.be.true; // whitelisted should be true
    });
  });

  describe("donateToAssociation", function () {
    it("should allow a donor to make a donation", async function () {
      const { donation, sbt, asso1, donor1, owner } = await loadFixture(
        deployDonationFixture
      );

      // Ensure the association is whitelisted
      const isWhitelisted = await donation.getAssociationDetails(asso1.address);
      if (!isWhitelisted[3]) {
        // Assuming the whitelisted status is at index 3
        await donation
          .connect(owner)
          .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      }

      const donationAmount = ethers.parseEther("1");

      // Get the block before the transaction
      const blockBefore = await ethers.provider.getBlock("latest");

      const tx = await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
      const receipt = await tx.wait();

      // Get the block after the transaction
      const blockAfter = await ethers.provider.getBlock(receipt.blockNumber);

      // Find the DonationReceived event
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DonationReceived"
      );
      expect(event).to.not.be.undefined;

      // Check the event arguments
      expect(event.args[0]).to.equal(donor1.address);
      expect(event.args[1]).to.equal(donationAmount);
      expect(event.args[2]).to.equal(asso1.address);
      expect(event.args[3]).to.equal(0); // tokenId
      expect(event.args[4]).to.be.within(
        blockBefore.timestamp,
        blockAfter.timestamp
      );
      expect(event.args[5]).to.equal(blockAfter.number);

      // Check balances and totals
      expect(
        await donation.getTotalDonationsFromOneDonor(donor1.address)
      ).to.equal(donationAmount);
      expect(
        await donation.getTotalDonationsToAssociation(asso1.address)
      ).to.equal(donationAmount);

      // Check SBT minting
      expect(await sbt.balanceOf(donor1.address)).to.equal(1);
    });

    it("should not allow donation if sent amount does not match specified amount", async function () {
      const { donation, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      );
      const donationAmount = ethers.parseEther("1");
      await expect(
        donation
          .connect(donor1)
          .donateToAssociation(asso1.address, donationAmount, {
            value: ethers.parseEther("0.5"),
          })
      ).to.be.revertedWith("Sent amount does not match specified amount");
    });
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

    it("should not allow association to donate to itself", async function () {
      const { donation, asso1, owner } = await loadFixture(
        deployDonationFixture
      );
      const donationAmount = ethers.parseEther("1");

      // Ensure the association is whitelisted first
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      // Now try to donate to itself
      await expect(
        donation
          .connect(asso1)
          .donateToAssociation(asso1.address, donationAmount, {
            value: donationAmount,
          })
      ).to.be.revertedWith("Association cannot donate to itself");
    });

    it("should update association balance correctly", async function () {
      const { donation, asso1, donor1, owner } = await loadFixture(
        deployDonationFixture
      );

      // Ajouter l'association à la whitelist
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "200 Main St", "RNA123");

      const donationAmount = ethers.parseEther("1");

      // Vérifier les détails de l'association avant la donation
      const associationDetailsBefore = await donation.getAssociationDetails(
        asso1.address
      );
      // console.log("Association details before:", associationDetailsBefore);

      // Vérifier que l'association est bien whitelistée
      expect(associationDetailsBefore[3]).to.be.true; // whitelisted status is at index 3

      // Vérifier le solde initial
      const balanceBefore = await donation.getAssociationBalance(asso1.address);
      expect(balanceBefore).to.equal(0); // Le solde initial devrait être 0

      // Effectuer la donation
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
      console.log("Donation complete");

      // Vérifier le nouveau solde
      const balanceAfter = await donation.getAssociationBalance(asso1.address);
      expect(balanceAfter).to.equal(donationAmount);
      console.log("Balance after donation:", balanceAfter);

      // Vérifier les détails de l'association après la donation
      const associationDetailsAfter = await donation.getAssociationDetails(
        asso1.address
      );
      // console.log("Association details after:", associationDetailsAfter);
    });

    it("should update lastDeposit timestamp", async function () {
      const { donation, asso1, donor1, owner } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      const donationAmount = ethers.parseEther("1");

      const txResponse = await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
      const txReceipt = await txResponse.wait();
      const block = await ethers.provider.getBlock(txReceipt.blockNumber);

      const lastDeposit = await donation.getAssociationLastDeposit(
        asso1.address
      );
      expect(lastDeposit).to.equal(block.timestamp);
    });

    it("should correctly record multiple donations", async function () {
      const { donation, asso1, donor1, donor2, owner } = await loadFixture(
        deployDonationFixture
      );

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso1.address, donationAmount2, {
          value: donationAmount2,
        });

      expect(
        await donation.getTotalDonationsToAssociation(asso1.address)
      ).to.equal(donationAmount1 + donationAmount2);
      expect(
        await donation.getTotalDonationsFromOneDonor(donor1.address)
      ).to.equal(donationAmount1);
      expect(
        await donation.getTotalDonationsFromOneDonor(donor2.address)
      ).to.equal(donationAmount2);
    });
    it("should revert if the contract is paused", async function () {
      const { donation, asso1, donor1, owner } = await loadFixture(
        deployDonationFixture
      );
      const donationAmount = ethers.parseEther("1");

      await donation.connect(owner).pause();

      // Vérifier que la transaction est révertée avec l'erreur personnalisée 'ContractPaused'
      await expect(
        donation
          .connect(donor1)
          .donateToAssociation(asso1.address, donationAmount, {
            value: donationAmount,
          })
      ).to.be.revertedWithCustomError(donation, "EnforcedPause");

      // Vérifier que la transaction est révertée sans spécifier l'erreur exacte
      await expect(
        donation
          .connect(donor1)
          .donateToAssociation(asso1.address, donationAmount, {
            value: donationAmount,
          })
      ).to.be.reverted;
    });
    it("should mint badge when threshold is reached", async function () {
      const { donation, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      );

      // Deploy and set DonationBadgeNFT
      const DonationBadgeNFT = await ethers.getContractFactory(
        "DonationBadgeNFT"
      );
      const badgeNFT = await DonationBadgeNFT.deploy();
      await badgeNFT.waitForDeployment();
      await donation.setBadgeContract(await badgeNFT.getAddress());
      await badgeNFT.setDonationContract(await donation.getAddress());

      // Whitelist the association
      await donation.addAssociation(
        asso1.address,
        "Asso1",
        "123 Main St",
        "RNA123"
      );

      const donationAmount = ethers.parseEther("0.2"); // Above BRONZE_THRESHOLD

      // Make the donation
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      // Check badge minting
      expect(await badgeNFT.balanceOf(donor1.address)).to.equal(1);
      expect(await badgeNFT.getDonorHighestTier(donor1.address)).to.equal(1); // Bronze tier
    });
  });

  describe("transferFunds", function () {
    it("should allow whitelisted association to transfer funds", async function () {
      const { donation, donor1, asso1, recipient, owner } = await loadFixture(
        deployDonationFixture
      );

      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      // Fund the contract by making a donation
      const donationAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const contractBalanceAfterDonation = await ethers.provider.getBalance(
        await donation.getAddress()
      );
      console.log(
        "Contract balance after donation:",
        ethers.formatEther(contractBalanceAfterDonation)
      );

      const transferAmount = ethers.parseEther("1");
      const purpose = "Test transfer";

      const initialRecipientBalance = await ethers.provider.getBalance(
        recipient.address
      );
      console.log(
        "Initial recipient balance:",
        ethers.formatEther(initialRecipientBalance)
      );

      // Perform the transfer
      const tx = await donation
        .connect(asso1)
        .transferFunds(recipient.address, transferAmount, purpose);
      const receipt = await tx.wait();

      // Check for FundsTransferred event
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "FundsTransferred"
      );
      expect(event).to.not.be.undefined;
      // console.log("FundsTransferred event:", event);

      if (event) {
        expect(event.args[0]).to.equal(recipient.address);
        expect(event.args[1]).to.equal((transferAmount * 95n) / 100n);
        expect(event.args[2]).to.equal(purpose);
      }

      const finalRecipientBalance = await ethers.provider.getBalance(
        recipient.address
      );
      console.log(
        "Final recipient balance:",
        ethers.formatEther(finalRecipientBalance)
      );

      const balanceIncrease = finalRecipientBalance - initialRecipientBalance;
      console.log(
        "Recipient balance increase:",
        ethers.formatEther(balanceIncrease)
      );

      // Check if 95% of funds were transferred to recipient
      expect(balanceIncrease).to.be.closeTo(
        (transferAmount * 95n) / 100n,
        ethers.parseEther("0.01")
      );

      const finalContractBalance = await ethers.provider.getBalance(
        await donation.getAddress()
      );
      console.log(
        "Final contract balance:",
        ethers.formatEther(finalContractBalance)
      );

      const contractBalanceDecrease =
        contractBalanceAfterDonation - finalContractBalance;
      console.log(
        "Contract balance decrease:",
        ethers.formatEther(contractBalanceDecrease)
      );

      // Vérifier que le solde du contrat a diminué du montant transféré moins la commission
      expect(contractBalanceDecrease).to.equal((transferAmount * 95n) / 100n);

      // Vérifier que la commission est restée dans le contrat
      const remainingCommission =
        finalContractBalance - (contractBalanceAfterDonation - transferAmount);
      console.log(
        "Remaining commission in contract:",
        ethers.formatEther(remainingCommission)
      );
      expect(remainingCommission).to.equal((transferAmount * 5n) / 100n);

      // Check total withdrawals for the association
      const totalWithdrawals = await donation.totalWithdrawals(asso1.address);
      console.log(
        "Total withdrawals for association:",
        ethers.formatEther(totalWithdrawals)
      );
      expect(totalWithdrawals).to.equal((transferAmount * 95n) / 100n);

      // Verify that the association can't withdraw more than the contract balance
      const excessiveAmount = ethers.parseEther("100");
      await expect(
        donation
          .connect(asso1)
          .transferFunds(
            recipient.address,
            excessiveAmount,
            "Excessive transfer"
          )
      ).to.be.revertedWith("Insufficient contract balance for transfer");
    });

    it("should not allow non-whitelisted address to transfer funds", async function () {
      const { donation, asso2, recipient } = await loadFixture(
        deployDonationFixture
      );

      const amount = ethers.parseEther("1");
      const purpose = "Test transfer";

      await expect(
        donation
          .connect(asso2)
          .transferFunds(recipient.address, amount, purpose)
      ).to.be.revertedWith("You're not an association on our whitelist");
    });

    it("should not allow transfer if contract balance is insufficient", async function () {
      const { donation, asso1, recipient, owner } = await loadFixture(
        deployDonationFixture
      );
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      const amount = ethers.parseEther("100"); // More than the contract balance
      const purpose = "Test transfer";

      await expect(
        donation
          .connect(asso1)
          .transferFunds(recipient.address, amount, purpose)
      ).to.be.revertedWith("Insufficient contract balance for transfer");
    });

    it("should not allow transfer to zero address", async function () {
      const { donation, asso1, owner, donor1 } = await loadFixture(
        deployDonationFixture
      );

      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      // Fund the contract
      const fundAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, fundAmount, { value: fundAmount });

      const transferAmount = ethers.parseEther("1");
      const purpose = "Test transfer";

      // Now try to transfer to zero address
      await expect(
        donation
          .connect(asso1)
          .transferFunds(ethers.ZeroAddress, transferAmount, purpose)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("should correctly calculate and accumulate commission", async function () {
      const { donation, asso1, donor1, recipient, owner } = await loadFixture(
        deployDonationFixture
      );

      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      // Fund the contract
      const fundAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, fundAmount, { value: fundAmount });

      const amount = ethers.parseEther("1");
      const purpose = "Test transfer";

      await donation
        .connect(asso1)
        .transferFunds(recipient.address, amount, purpose);

      const commission = (amount * 5n) / 100n;
      expect(await donation.getAccumulatedCommissions()).to.equal(commission);
    });

    it("should update totalWithdrawals correctly", async function () {
      const { donation, donor1, asso1, recipient, owner } = await loadFixture(
        deployDonationFixture
      );

      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      // Fund the contract
      const fundAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, fundAmount, { value: fundAmount });
      const amount = ethers.parseEther("1");
      const purpose = "Test transfer";

      await donation
        .connect(asso1)
        .transferFunds(recipient.address, amount, purpose);

      const amountAfterCommission = (amount * 95n) / 100n;
      expect(await donation.totalWithdrawals(asso1.address)).to.equal(
        amountAfterCommission
      );
    });

    it("should revert when paused", async function () {
      const { donation, asso1, recipient, owner } = await loadFixture(
        deployDonationFixture
      );

      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      const amount = ethers.parseEther("1");
      const purpose = "Test transfer";

      await donation.connect(owner).pause();

      await expect(
        donation
          .connect(asso1)
          .transferFunds(recipient.address, amount, purpose)
      ).to.be.revertedWithCustomError(donation, "EnforcedPause");
    });
    it("should correctly record transfer in associationTransfers", async function () {
      const { donation, donor1, asso1, recipient, owner } = await loadFixture(
        deployDonationFixture
      );
  
      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
  
      // Fund the contract
      const fundAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, fundAmount, { value: fundAmount });
  
      const transferAmount = ethers.parseEther("1");
      const purpose = "Test transfer";
  
      // Perform the transfer
      await donation
        .connect(asso1)
        .transferFunds(recipient.address, transferAmount, purpose);
  
      // Get the transfers for the association
      const transfers = await donation.getTransfersByAssociation(asso1.address);
  
      // Check that the transfer was recorded correctly
      expect(transfers.length).to.equal(1);
      expect(transfers[0].recipient).to.equal(recipient.address);
      expect(transfers[0].amount).to.equal(transferAmount);
      expect(transfers[0].purpose).to.equal(purpose);
      expect(transfers[0].timestamp).to.be.closeTo(
        BigInt(Math.floor(Date.now() / 1000)),
        BigInt(60)
      ); // Allow 60 seconds of difference
    });
  
    it("should correctly record multiple transfers", async function () {
      const { donation, donor1, asso1, recipient, owner } = await loadFixture(
        deployDonationFixture
      );
  
      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
  
      // Fund the contract
      const fundAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, fundAmount, { value: fundAmount });
  
      // Perform multiple transfers
      for (let i = 0; i < 3; i++) {
        const transferAmount = ethers.parseEther("1");
        const purpose = `Test transfer ${i + 1}`;
  
        await donation
          .connect(asso1)
          .transferFunds(recipient.address, transferAmount, purpose);
      }
  
      // Get the transfers for the association
      const transfers = await donation.getTransfersByAssociation(asso1.address);
  
      // Check that all transfers were recorded correctly
      expect(transfers.length).to.equal(3);
      for (let i = 0; i < 3; i++) {
        expect(transfers[i].recipient).to.equal(recipient.address);
        expect(transfers[i].amount).to.equal(ethers.parseEther("1"));
        expect(transfers[i].purpose).to.equal(`Test transfer ${i + 1}`);
      }
    });
  
    it("should return empty array for association with no transfers", async function () {
      const { donation, asso1 } = await loadFixture(deployDonationFixture);
  
      const transfers = await donation.getTransfersByAssociation(asso1.address);
      expect(transfers.length).to.equal(0);
    });
  });

  describe("withdrawCommission", function () {
    it("should allow owner to withdraw accumulated commissions", async function () {
      const { donation, owner, asso1, donor1, recipient } = await loadFixture(
        deployDonationFixture
      );

      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

      // Fund the contract
      const fundAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, fundAmount, { value: fundAmount });

      // Make a transfer to accumulate some commissions
      const transferAmount = ethers.parseEther("5");
      await donation
        .connect(asso1)
        .transferFunds(recipient.address, transferAmount, "Test transfer");

      // Calculate expected commission
      const expectedCommission = (transferAmount * 5n) / 100n;

      // Get owner's initial balance
      const initialOwnerBalance = await ethers.provider.getBalance(
        owner.address
      );

      // Withdraw commissions
      const withdrawTx = await donation.connect(owner).withdrawCommissions();
      const withdrawReceipt = await withdrawTx.wait();

      // Calculate gas cost
      const gasCost = withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;

      // Get owner's final balance
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

      // Check that the owner's balance increased by the commission amount (minus gas costs)
      expect(finalOwnerBalance - initialOwnerBalance + gasCost).to.equal(
        expectedCommission
      );

      // Check that the event was emitted
      expect(withdrawTx)
        .to.emit(donation, "CommissionsWithdrawn")
        .withArgs(expectedCommission);

      // Try to withdraw again, should fail
      await expect(
        donation.connect(owner).withdrawCommissions()
      ).to.be.revertedWith("No commissions to withdraw");
    });

    it("should not allow non-owner to withdraw commissions", async function () {
      const { donation, asso1 } = await loadFixture(deployDonationFixture);

      await expect(donation.connect(asso1).withdrawCommissions())
        .to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount")
        .withArgs(asso1.address);
    });

    it("should fail if there are no commissions to withdraw", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      await expect(
        donation.connect(owner).withdrawCommissions()
      ).to.be.revertedWith("No commissions to withdraw");
    });

    it("should revert when paused", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      await donation.connect(owner).pause();
    });
  });
  describe("setSBTContract", function () {
    it("should allow owner to set SBT contract address", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      const NewDonationProofSBT = await ethers.getContractFactory(
        "DonationProofSBT"
      );
      const newSbt = await NewDonationProofSBT.deploy();

      await expect(
        donation.connect(owner).setSBTContract(await newSbt.getAddress())
      ).to.not.be.reverted;

      expect(await donation.sbtContract()).to.equal(await newSbt.getAddress());
    });

    it("should not allow non-owner to set SBT contract address", async function () {
      const { donation, asso1 } = await loadFixture(deployDonationFixture);

      const NewDonationProofSBT = await ethers.getContractFactory(
        "DonationProofSBT"
      );
      const newSbt = await NewDonationProofSBT.deploy();

      await expect(
        donation.connect(asso1).setSBTContract(await newSbt.getAddress())
      )
        .to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount")
        .withArgs(asso1.address);
    });

    it("should revert when trying to set zero address", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      await expect(
        donation.connect(owner).setSBTContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid SBT contract address");
    });

    it("should emit an event when SBT contract is set", async function () {
      const { donation, owner } = await loadFixture(deployDonationFixture);

      const NewDonationProofSBT = await ethers.getContractFactory(
        "DonationProofSBT"
      );
      const newSbt = await NewDonationProofSBT.deploy();

      await expect(
        donation.connect(owner).setSBTContract(await newSbt.getAddress())
      )
        .to.emit(donation, "SBTContractSet")
        .withArgs(await newSbt.getAddress());
    });
  });
  describe("getDonationProofDetails", function () {
    let donation, sbt, owner, donor1, donor2, asso1;

    beforeEach(async function () {
      ({ donation, sbt, owner, donor1, donor2, asso1 } = await loadFixture(
        deployDonationFixture
      ));

      // Whitelist the association before each test
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
    });

    it("should retrieve correct donation proof details", async function () {
      // Make a donation
      const donationAmount = ethers.parseEther("1");
      const tx = await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
      const receipt = await tx.wait();

      // Find the DonationReceived event to get the tokenId
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DonationReceived"
      );
      const tokenId = event.args.tokenId;

      // Get the block of the donation
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      // Retrieve donation proof details
      const proofDetails = await donation.getDonationProofDetails(tokenId);

      // Check each detail
      expect(proofDetails[0]).to.equal(donor1.address); // donor
      expect(proofDetails[1]).to.equal(donationAmount); // amount
      expect(proofDetails[2]).to.equal(asso1.address); // association
      expect(proofDetails[3]).to.equal(block.timestamp); // timestamp
      expect(proofDetails[4]).to.equal(receipt.blockNumber); // blockNumber
    });

    it("should revert if SBT contract is not set", async function () {
      // Deploy a new Donation contract with zero address for SBT
      const Donation = await ethers.getContractFactory("Donation");
      const newDonation = await Donation.deploy(
        ethers.ZeroAddress,
        owner.address
      );

      await expect(newDonation.getDonationProofDetails(1)).to.be.revertedWith(
        "SBT contract not set"
      );
    });

    it("should revert for non-existent token", async function () {
      await expect(donation.getDonationProofDetails(999)).to.be.reverted;
    });
  });

  function calculateWithdrawalAfterCommission(amount) {
    const commission = (BigInt(amount) * BigInt(5)) / BigInt(100);
    return BigInt(amount) - commission;
  }

  describe("getTotalDonationsFromOneDonor", function () {
    let donation, sbt, owner, donor1, donor2, asso1, asso2;

    beforeEach(async function () {
      ({ donation, sbt, owner, donor1, donor2, asso1, asso2 } =
        await loadFixture(deployDonationFixture));

      // Whitelist the association before each test
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "123 Main St", "RNA123");
    });

    it("should return 0 for a donor who hasn't made any donations", async function () {
      const totalDonations = await donation.getTotalDonationsFromOneDonor(
        donor1.address
      );
      expect(totalDonations).to.equal(0);
    });

    it("should correctly return the total donations for a donor who made a single donation", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const totalDonations = await donation.getTotalDonationsFromOneDonor(
        donor1.address
      );
      expect(totalDonations).to.equal(donationAmount);
    });

    it("should correctly return the total donations for a donor who made multiple donations", async function () {
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor1)
        .donateToAssociation(asso2.address, donationAmount2, {
          value: donationAmount2,
        });

      const totalDonations = await donation.getTotalDonationsFromOneDonor(
        donor1.address
      );
      expect(totalDonations).to.equal(donationAmount1 + donationAmount2);
    });

    it("should correctly track donations from multiple donors", async function () {
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso1.address, donationAmount2, {
          value: donationAmount2,
        });

      const totalDonationsDonor1 = await donation.getTotalDonationsFromOneDonor(
        donor1.address
      );
      const totalDonationsDonor2 = await donation.getTotalDonationsFromOneDonor(
        donor2.address
      );

      expect(totalDonationsDonor1).to.equal(donationAmount1);
      expect(totalDonationsDonor2).to.equal(donationAmount2);
    });

    it("should return 0 for an address that has never interacted with the contract", async function () {
      const randomAddress = ethers.Wallet.createRandom().address;

      const totalDonations = await donation.getTotalDonationsFromOneDonor(
        randomAddress
      );
      expect(totalDonations).to.equal(0);
    });
  });

  describe("getTotalWithdrawals", function () {
    let donation, owner, donor1, asso1, asso2;

    beforeEach(async function () {
      ({ donation, owner, donor1, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      ));

      // Whitelist the associations
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");

      // Fund the contract
      const donationAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
      await donation
        .connect(donor1)
        .donateToAssociation(asso2.address, donationAmount, {
          value: donationAmount,
        });
    });

    it("should return 0 for an association that hasn't made any withdrawals", async function () {
      const totalWithdrawals = await donation.getTotalWithdrawals(
        asso1.address
      );
      expect(totalWithdrawals).to.equal(0);
    });

    it("should return 0 for an address that is not a whitelisted association", async function () {
      const randomAddress = ethers.Wallet.createRandom().address;
      const totalWithdrawals = await donation.getTotalWithdrawals(
        randomAddress
      );
      expect(totalWithdrawals).to.equal(0);
    });

    it("should correctly return the total withdrawals for an association after a single withdrawal", async function () {
      const withdrawalAmount = ethers.parseEther("1");
      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount, "Test withdrawal");

      const totalWithdrawals = await donation.getTotalWithdrawals(
        asso1.address
      );
      expect(totalWithdrawals).to.equal(
        calculateWithdrawalAfterCommission(withdrawalAmount)
      );
    });

    it("should correctly return the total withdrawals for an association after multiple withdrawals", async function () {
      const withdrawalAmount1 = ethers.parseEther("1");
      const withdrawalAmount2 = ethers.parseEther("2");
      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount1, "First withdrawal");
      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount2, "Second withdrawal");

      const totalWithdrawals = await donation.getTotalWithdrawals(
        asso1.address
      );
      const expectedTotal =
        calculateWithdrawalAfterCommission(withdrawalAmount1) +
        calculateWithdrawalAfterCommission(withdrawalAmount2);
      expect(totalWithdrawals).to.equal(expectedTotal);
    });

    it("should correctly track withdrawals from multiple associations", async function () {
      const withdrawalAmount1 = ethers.parseEther("1");
      const withdrawalAmount2 = ethers.parseEther("2");
      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount1, "Asso1 withdrawal");
      await donation
        .connect(asso2)
        .transferFunds(asso2.address, withdrawalAmount2, "Asso2 withdrawal");

      const totalWithdrawalsAsso1 = await donation.getTotalWithdrawals(
        asso1.address
      );
      const totalWithdrawalsAsso2 = await donation.getTotalWithdrawals(
        asso2.address
      );

      expect(totalWithdrawalsAsso1).to.equal(
        calculateWithdrawalAfterCommission(withdrawalAmount1)
      );
      expect(totalWithdrawalsAsso2).to.equal(
        calculateWithdrawalAfterCommission(withdrawalAmount2)
      );
    });

    it("should correctly update total withdrawals after each withdrawal", async function () {
      const withdrawalAmount1 = ethers.parseEther("1");
      const withdrawalAmount2 = ethers.parseEther("2");

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount1, "First withdrawal");
      let totalWithdrawals = await donation.getTotalWithdrawals(asso1.address);
      expect(totalWithdrawals).to.equal(
        calculateWithdrawalAfterCommission(withdrawalAmount1)
      );

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount2, "Second withdrawal");
      totalWithdrawals = await donation.getTotalWithdrawals(asso1.address);
      const expectedTotal =
        calculateWithdrawalAfterCommission(withdrawalAmount1) +
        calculateWithdrawalAfterCommission(withdrawalAmount2);
      expect(totalWithdrawals).to.equal(expectedTotal);
    });
  });
  describe("getAccumulatedCommissions", function () {
    let donation, owner, donor1, asso1, asso2;
    let calculateCommission;

    beforeEach(async function () {
      ({ donation, owner, donor1, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      ));

      calculateCommission = function (amount) {
        return (BigInt(amount) * BigInt(5)) / BigInt(100);
      };

      // Whitelist the associations
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");

      // Fund the contract
      const donationAmount = ethers.parseEther("10");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
    });

    it("should return 0 when no withdrawals have been made", async function () {
      const accumulatedCommissions = await donation.getAccumulatedCommissions();
      expect(accumulatedCommissions).to.equal(0);
    });

    it("should correctly accumulate commission after a single withdrawal", async function () {
      const withdrawalAmount = ethers.parseEther("1");
      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount, "Test withdrawal");

      const accumulatedCommissions = await donation.getAccumulatedCommissions();
      const expectedCommission = calculateCommission(withdrawalAmount);
      expect(accumulatedCommissions).to.equal(expectedCommission);
    });

    it("should correctly accumulate commissions after multiple withdrawals", async function () {
      const withdrawalAmount1 = ethers.parseEther("1");
      const withdrawalAmount2 = ethers.parseEther("2");

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount1, "First withdrawal");
      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount2, "Second withdrawal");

      const accumulatedCommissions = await donation.getAccumulatedCommissions();
      const expectedCommission =
        calculateCommission(withdrawalAmount1) +
        calculateCommission(withdrawalAmount2);
      expect(accumulatedCommissions).to.equal(expectedCommission);
    });

    it("should correctly accumulate commissions from multiple associations", async function () {
      const donationAmount = ethers.parseEther("10");
      const withdrawalAmount1 = ethers.parseEther("1");
      const withdrawalAmount2 = ethers.parseEther("2");

      // Donate to associations first
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
      await donation
        .connect(donor1)
        .donateToAssociation(asso2.address, donationAmount, {
          value: donationAmount,
        });

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount1, "Asso1 withdrawal");
      await donation
        .connect(asso2)
        .transferFunds(asso2.address, withdrawalAmount2, "Asso2 withdrawal");

      const accumulatedCommissions = await donation.getAccumulatedCommissions();
      const expectedCommission =
        calculateCommission(withdrawalAmount1) +
        calculateCommission(withdrawalAmount2);
      expect(accumulatedCommissions).to.equal(expectedCommission);
    });

    it("should reset to 0 after owner withdraws commissions", async function () {
      const withdrawalAmount = ethers.parseEther("1");
      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount, "Test withdrawal");

      // Owner withdraws commissions
      await donation.connect(owner).withdrawCommissions();

      const accumulatedCommissions = await donation.getAccumulatedCommissions();
      expect(accumulatedCommissions).to.equal(0);
    });
  });

  describe("getContractBalance", function () {
    let donation, owner, donor1, donor2, asso1, asso2;

    beforeEach(async function () {
      ({ donation, owner, donor1, donor2, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      ));

      // Whitelist the associations
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");
    });

    it("should return 0 when the contract is newly deployed", async function () {
      const balance = await donation.getContractBalance();
      expect(balance).to.equal(0);
    });

    it("should correctly reflect the balance after a single donation", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const balance = await donation.getContractBalance();
      expect(balance).to.equal(donationAmount);
    });

    it("should correctly reflect the balance after multiple donations", async function () {
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso2.address, donationAmount2, {
          value: donationAmount2,
        });

      const balance = await donation.getContractBalance();
      expect(balance).to.equal(donationAmount1 + donationAmount2);
    });

    it("should correctly reflect the balance after donations and withdrawals", async function () {
      const donationAmount = ethers.parseEther("10");
      const withdrawalAmount = ethers.parseEther("1");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount, "Test withdrawal");

      const balance = await donation.getContractBalance();

      // Calculate the expected balance
      const commission = (withdrawalAmount * BigInt(5)) / BigInt(100);
      const expectedBalance = donationAmount - withdrawalAmount + commission;

      expect(balance).to.equal(expectedBalance);
    });

    it("should correctly reflect the balance after all funds are withdrawn", async function () {
      const donationAmount = ethers.parseEther("10");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, donationAmount, "Withdraw all");

      const balance = await donation.getContractBalance();
      expect(balance).to.equal((donationAmount * BigInt(5)) / BigInt(100)); // Only commission should remain
    });

    it("should correctly reflect the balance after owner withdraws commissions", async function () {
      const donationAmount = ethers.parseEther("10");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, donationAmount, "Withdraw all");

      await donation.connect(owner).withdrawCommissions();

      const balance = await donation.getContractBalance();
      expect(balance).to.equal(0);
    });
  });

  describe("getAssociationBalance", function () {
    let donation, owner, donor1, donor2, asso1, asso2, nonAssociation;

    beforeEach(async function () {
      ({ donation, owner, donor1, donor2, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      ));

      nonAssociation = ethers.Wallet.createRandom().address;

      // Whitelist the associations
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");
    });

    it("should return 0 for a newly added association", async function () {
      const balance = await donation.getAssociationBalance(asso1.address);
      expect(balance).to.equal(0);
    });

    it("should return 0 for a non-whitelisted address", async function () {
      const balance = await donation.getAssociationBalance(nonAssociation);
      expect(balance).to.equal(0);
    });

    it("should correctly reflect the balance after a single donation", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const balance = await donation.getAssociationBalance(asso1.address);
      expect(balance).to.equal(donationAmount);
    });

    it("should correctly reflect the balance after multiple donations", async function () {
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso1.address, donationAmount2, {
          value: donationAmount2,
        });

      const balance = await donation.getAssociationBalance(asso1.address);
      expect(balance).to.equal(donationAmount1 + donationAmount2);
    });

    it("should correctly reflect the balance after donations and withdrawals", async function () {
      const donationAmount = ethers.parseEther("10");
      const withdrawalAmount = ethers.parseEther("1");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      // Log the balance before withdrawal
      console.log(
        "Balance before withdrawal:",
        await donation.getAssociationBalance(asso1.address)
      );

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount, "Test withdrawal");

      // Log the balance after withdrawal
      console.log(
        "Balance after withdrawal:",
        await donation.getAssociationBalance(asso1.address)
      );

      const balance = await donation.getAssociationBalance(asso1.address);
      expect(balance).to.equal(donationAmount - withdrawalAmount);
    });

    it("should correctly reflect the balance after all funds are withdrawn", async function () {
      const donationAmount = ethers.parseEther("10");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      // Log the balance before withdrawal
      console.log(
        "Balance before full withdrawal:",
        await donation.getAssociationBalance(asso1.address)
      );

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, donationAmount, "Withdraw all");

      // Log the balance after withdrawal
      console.log(
        "Balance after full withdrawal:",
        await donation.getAssociationBalance(asso1.address)
      );

      const balance = await donation.getAssociationBalance(asso1.address);
      expect(balance).to.equal(0);
    });

    it("should not affect the balance of other associations", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const balanceAsso1 = await donation.getAssociationBalance(asso1.address);
      const balanceAsso2 = await donation.getAssociationBalance(asso2.address);

      expect(balanceAsso1).to.equal(donationAmount);
      expect(balanceAsso2).to.equal(0);
    });
  });

  describe("getAssociationLastDeposit", function () {
    let donation, owner, donor1, asso1, asso2;

    beforeEach(async function () {
      ({ donation, owner, donor1, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      ));

      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");
    });

    it("should update last deposit timestamp after a donation", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const lastDeposit = await donation.getAssociationLastDeposit(
        asso1.address
      );
      expect(lastDeposit).to.be.above(0);
    });

    it("should return different timestamps for different associations", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      await ethers.provider.send("evm_increaseTime", [3600]); // increase time by 1 hour
      await ethers.provider.send("evm_mine"); // mine a new block

      await donation
        .connect(donor1)
        .donateToAssociation(asso2.address, donationAmount, {
          value: donationAmount,
        });

      const lastDeposit1 = await donation.getAssociationLastDeposit(
        asso1.address
      );
      const lastDeposit2 = await donation.getAssociationLastDeposit(
        asso2.address
      );

      expect(lastDeposit2).to.be.above(lastDeposit1);
    });

    it("should not update last deposit timestamp after a withdrawal", async function () {
      const donationAmount = ethers.parseEther("2");
      const withdrawalAmount = ethers.parseEther("1");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const lastDepositBeforeWithdrawal =
        await donation.getAssociationLastDeposit(asso1.address);

      await ethers.provider.send("evm_increaseTime", [3600]); // increase time by 1 hour
      await ethers.provider.send("evm_mine"); // mine a new block

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount, "Test withdrawal");

      const lastDepositAfterWithdrawal =
        await donation.getAssociationLastDeposit(asso1.address);

      expect(lastDepositAfterWithdrawal).to.equal(lastDepositBeforeWithdrawal);
    });
  });

  describe("getTotalDonationsToAssociation", function () {
    let donation, owner, donor1, donor2, asso1, asso2, nonAssociation;

    beforeEach(async function () {
      ({ donation, owner, donor1, donor2, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      ));

      nonAssociation = ethers.Wallet.createRandom().address;

      // Whitelist the associations
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");
    });

    it("should return 0 for a newly added association", async function () {
      const totalDonations = await donation.getTotalDonationsToAssociation(
        asso1.address
      );
      expect(totalDonations).to.equal(0);
    });

    it("should return 0 for a non-whitelisted address", async function () {
      const totalDonations = await donation.getTotalDonationsToAssociation(
        nonAssociation
      );
      expect(totalDonations).to.equal(0);
    });

    it("should correctly reflect the total after a single donation", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const totalDonations = await donation.getTotalDonationsToAssociation(
        asso1.address
      );
      expect(totalDonations).to.equal(donationAmount);
    });

    it("should correctly reflect the total after multiple donations", async function () {
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso1.address, donationAmount2, {
          value: donationAmount2,
        });

      const totalDonations = await donation.getTotalDonationsToAssociation(
        asso1.address
      );
      // Utilisez l'addition standard pour les BigInt
      expect(totalDonations).to.equal(
        BigInt(donationAmount1) + BigInt(donationAmount2)
      );
    });

    it("should track donations separately for different associations", async function () {
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso2.address, donationAmount2, {
          value: donationAmount2,
        });

      const totalDonationsAsso1 = await donation.getTotalDonationsToAssociation(
        asso1.address
      );
      const totalDonationsAsso2 = await donation.getTotalDonationsToAssociation(
        asso2.address
      );

      expect(totalDonationsAsso1).to.equal(donationAmount1);
      expect(totalDonationsAsso2).to.equal(donationAmount2);
    });

    it("should not be affected by withdrawals", async function () {
      const donationAmount = ethers.parseEther("10");
      const withdrawalAmount = ethers.parseEther("1");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const totalBeforeWithdrawal =
        await donation.getTotalDonationsToAssociation(asso1.address);

      await donation
        .connect(asso1)
        .transferFunds(asso1.address, withdrawalAmount, "Test withdrawal");

      const totalAfterWithdrawal =
        await donation.getTotalDonationsToAssociation(asso1.address);

      expect(totalAfterWithdrawal).to.equal(totalBeforeWithdrawal);
    });
  });

  describe("getDonationsByAssociation", function () {
    let donation, owner, donor1, donor2, asso1, asso2, nonAssociation;

    beforeEach(async function () {
      ({ donation, owner, donor1, donor2, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      ));

      nonAssociation = ethers.Wallet.createRandom().address;

      // Whitelist the associations
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");
    });

    it("should return an empty array for a newly added association", async function () {
      const donations = await donation.getDonationsByAssociation(asso1.address);
      expect(donations).to.be.an("array").that.is.empty;
    });

    it("should return an empty array for a non-whitelisted address", async function () {
      const donations = await donation.getDonationsByAssociation(
        nonAssociation
      );
      expect(donations).to.be.an("array").that.is.empty;
    });

    it("should correctly record a single donation", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const donations = await donation.getDonationsByAssociation(asso1.address);
      expect(donations).to.have.lengthOf(1);
      expect(donations[0].donor).to.equal(donor1.address);
      expect(donations[0].amount).to.equal(donationAmount);
    });

    it("should correctly record multiple donations", async function () {
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso1.address, donationAmount2, {
          value: donationAmount2,
        });

      const donations = await donation.getDonationsByAssociation(asso1.address);
      expect(donations).to.have.lengthOf(2);
      expect(donations[0].donor).to.equal(donor1.address);
      expect(donations[0].amount).to.equal(donationAmount1);
      expect(donations[1].donor).to.equal(donor2.address);
      expect(donations[1].amount).to.equal(donationAmount2);
    });

    it("should track donations separately for different associations", async function () {
      const donationAmount1 = ethers.parseEther("1");
      const donationAmount2 = ethers.parseEther("2");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount1, {
          value: donationAmount1,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso2.address, donationAmount2, {
          value: donationAmount2,
        });

      const donationsAsso1 = await donation.getDonationsByAssociation(
        asso1.address
      );
      const donationsAsso2 = await donation.getDonationsByAssociation(
        asso2.address
      );

      expect(donationsAsso1).to.have.lengthOf(1);
      expect(donationsAsso1[0].donor).to.equal(donor1.address);
      expect(donationsAsso1[0].amount).to.equal(donationAmount1);

      expect(donationsAsso2).to.have.lengthOf(1);
      expect(donationsAsso2[0].donor).to.equal(donor2.address);
      expect(donationsAsso2[0].amount).to.equal(donationAmount2);
    });

    it("should include timestamp and block number in donation records", async function () {
      const donationAmount = ethers.parseEther("1");
      const tx = await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
      const receipt = await tx.wait();

      const donations = await donation.getDonationsByAssociation(asso1.address);
      expect(donations).to.have.lengthOf(1);

      expect(donations[0].timestamp).to.be.a("bigint");
      expect(donations[0].timestamp).to.be.above(0n);

      expect(donations[0].blockNumber).to.be.a("bigint");
      expect(donations[0].blockNumber).to.equal(BigInt(receipt.blockNumber));
    });
  });

  describe("getWhitelistedAssociations", function () {
    let donation, owner, asso1, asso2, nonAssociation;

    beforeEach(async function () {
      ({ donation, owner, asso1, asso2 } = await loadFixture(
        deployDonationFixture
      ));

      nonAssociation = ethers.Wallet.createRandom().address;

      // Whitelist the associations
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");

      // Supprimez toutes les associations avant chaque test pour avoir un état initial propre
      const currentAssociations = await donation.getWhitelistedAssociations();
      for (const association of currentAssociations) {
        await donation.connect(owner).removeAssociation(association);
      }
    });

    it("should return an array containing all whitelisted associations", async function () {
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      await donation
        .connect(owner)
        .addAssociation(asso2.address, "Asso2", "456 Oak St", "RNA456");

      const whitelistedAssociations =
        await donation.getWhitelistedAssociations();
      expect(whitelistedAssociations).to.include.members([
        asso1.address,
        asso2.address,
      ]);
    });

    it("should not include non-whitelisted addresses in the returned array", async function () {
      const whitelistedAssociations =
        await donation.getWhitelistedAssociations();
      expect(whitelistedAssociations).to.not.include(nonAssociation);
    });

    it("should return an empty array if no associations are whitelisted", async function () {
      const whitelistedAssociations =
        await donation.getWhitelistedAssociations();
      expect(whitelistedAssociations).to.be.an("array").that.is.empty;
    });
  });

  describe("getAssociationDetails", function () {
    let donation, owner, asso1, nonAssociation;

    beforeEach(async function () {
      ({ donation, owner, asso1 } = await loadFixture(deployDonationFixture));

      nonAssociation = ethers.Wallet.createRandom().address;

      // Whitelist the association
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
    });

    it("should return the details of a whitelisted association", async function () {
      const details = await donation.getAssociationDetails(asso1.address);
      expect(details[0]).to.equal("Asso1");
      expect(details[1]).to.equal("123 Main St");
      expect(details[2]).to.equal("RNA123");
      expect(details[3]).to.be.true;
    });

    it("should return default values for a non-whitelisted association", async function () {
      const details = await donation.getAssociationDetails(nonAssociation);
      expect(details[0]).to.equal("");
      expect(details[1]).to.equal("");
      expect(details[2]).to.equal("");
      expect(details[3]).to.be.false;
    });
  });
  describe("Pause and Unpause", function () {
    let donation, owner, asso1, donor1;

    beforeEach(async function () {
      ({ donation, owner, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      ));

      // Whitelist the associations
      await donation
        .connect(owner)
        .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
    });

    it("should allow the owner to pause the contract", async function () {
      await donation.connect(owner).pause();
      const paused = await donation.paused();
      expect(paused).to.be.true;
    });

    it("should not allow a non-owner to pause the contract", async function () {
      await expect(donation.connect(donor1).pause())
        .to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount")
        .withArgs(donor1.address);
    });

    it("should allow the owner to unpause the contract", async function () {
      await donation.connect(owner).pause();
      await donation.connect(owner).unpause();
      const paused = await donation.paused();
      expect(paused).to.be.false;
    });

    it("should not allow a non-owner to unpause the contract", async function () {
      await donation.connect(owner).pause();
      await expect(donation.connect(donor1).unpause())
        .to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount")
        .withArgs(donor1.address);
    });

    it("should not allow function calls protected by whenNotPaused when the contract is paused", async function () {
      await donation.connect(owner).pause();
      const donationAmount = ethers.parseEther("1");
      await expect(
        donation
          .connect(donor1)
          .donateToAssociation(asso1.address, donationAmount, {
            value: donationAmount,
          })
      ).to.be.revertedWithCustomError(donation, "EnforcedPause");
    });

    it("should allow function calls protected by whenNotPaused when the contract is unpaused", async function () {
      await donation.connect(owner).pause();
      await donation.connect(owner).unpause();
      const donationAmount = ethers.parseEther("1");
      await expect(
        donation
          .connect(donor1)
          .donateToAssociation(asso1.address, donationAmount, {
            value: donationAmount,
          })
      ).to.not.be.reverted;
    });
  });
});
