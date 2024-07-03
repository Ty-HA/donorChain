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

    // Now deploy Donation with the SBT contract address
    const Donation = await ethers.getContractFactory("Donation");
    const donation = await Donation.deploy(sbtAddress);
    await donation.waitForDeployment();

    const donationAddress = await donation.getAddress();
    console.log("Donation contract deployed at:", donationAddress);

    // Set the Donation contract address in the SBT contract
    await sbt.setDonationContract(donationAddress);

    return {
      donation,
      sbt,
      owner,
      asso1,
      asso2,
      asso3,
      donor1,
      donor2,
      recipient,
    };
  }

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
  });
});
