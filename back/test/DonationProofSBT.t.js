const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonationProofSBT", function () {
  async function deployDonationFixture() {
    const [owner, asso1, donor1, donor2] = await ethers.getSigners();

    // Deploy DonationProofSBT first
    const DonationProofSBT = await ethers.getContractFactory(
      "DonationProofSBT"
    );
    const sbt = await DonationProofSBT.deploy();
    await sbt.waitForDeployment();

    const sbtAddress = await sbt.getAddress();
    console.log("SBT contract deployed at:", sbtAddress);

    // Deploy DonationProofSBT first
    const DonationBadgeNFT = await ethers.getContractFactory(
      "DonationBadgeNFT"
    );
    const badge = await DonationBadgeNFT.deploy();
    await badge.waitForDeployment();

    const badgeAddress = await badge.getAddress();
    console.log("Badge NFT contract deployed at:", badgeAddress);

    // Now deploy Donation with the SBT contract address
    const Donation = await ethers.getContractFactory("Donation");
    const donation = await Donation.deploy(sbtAddress, badgeAddress);
    await donation.waitForDeployment();

    await donation
      .connect(owner)
      .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");

    const donationAddress = await donation.getAddress();
    console.log("Donation contract deployed at:", donationAddress);

    // Set the Donation contract address in the SBT contract
    await sbt.setDonationContract(donationAddress);
    await badge.setDonationContract(donationAddress);

    return { donation, sbt, badge, owner, asso1, donor1, donor2 };
  }

  it("should deploy the DonationProofSBT contract successfully", async function () {
    const { sbt } = await loadFixture(deployDonationFixture);
    expect(await sbt.name()).to.equal("DonationProof");
    expect(await sbt.symbol()).to.equal("DPF");
  });

  it("should set the Donation contract address", async function () {
    const { sbt, donation } = await loadFixture(deployDonationFixture);
    expect(await sbt.donationContract()).to.equal(await donation.getAddress());
  });

  describe("onlyDonationContract modifier", function () {
    it("should not allow non-donation contract address to call restricted function", async function () {
      const { sbt, owner, asso1, donation } = await loadFixture(
        deployDonationFixture
      );

      // Assuming the custom error is something like UnauthorizedCaller and is emitted when the check fails
      await expect(sbt.connect(asso1).setDonationContract(asso1.address))
        .to.be.revertedWithCustomError(sbt, "OwnableUnauthorizedAccount")
        .withArgs(asso1.address);

      // Verify that owner can still call setDonationContract
      await sbt.connect(owner).setDonationContract(owner.address);
      const newDonationContract = await sbt.donationContract();
      expect(newDonationContract).to.equal(owner.address);
    });
  });

  describe("Constructor", function () {
    it("should set the initial base URI correctly", async function () {
      const newSBT = await (await ethers.getContractFactory("DonationProofSBT")).deploy();
      expect(await newSBT.getBaseURI()).to.equal("https://rose-written-jellyfish-653.mypinata.cloud/ipfs/QmbQzHVt2xdJ1vDRMjAoyF6eaLH3WRY3D3mgqTW1MWdxuY/");
    });
  });

  describe("setBaseURI & getBaseURI", function () {
    it("should set the base URI and allow it to be retrieved", async function () {
      const { sbt, owner } = await loadFixture(deployDonationFixture);
      const newBaseURI = "https://example.com/";
  
      await sbt.connect(owner).setBaseURI(newBaseURI);
      expect(await sbt.getBaseURI()).to.equal(newBaseURI);
    });
  
    it("should not allow non-owner to set base URI", async function () {
      const { sbt, donor1, owner } = await loadFixture(deployDonationFixture);
      const newBaseURI = "https://newuri.com/";
      
      expect(await sbt.owner()).to.not.equal(donor1.address);
      expect(await sbt.owner()).to.equal(owner.address);
  
      await expect(
        sbt.connect(donor1).setBaseURI(newBaseURI)
      ).to.be.revertedWithCustomError(sbt, "OwnableUnauthorizedAccount")
        .withArgs(donor1.address);
  
      expect(await sbt.getBaseURI()).to.not.equal(newBaseURI);
    });
  });

  describe("mint function", function () {
    let sbt, donation, owner, asso1, donor1, donor2;
    const zeroAddress = ethers.ZeroAddress;

    beforeEach(async function () {
      ({ sbt, donation, owner, asso1, donor1, donor2 } = await loadFixture(
        deployDonationFixture
      ));
      // Ensure the donation contract is set
      await sbt.connect(owner).setDonationContract(await donation.getAddress());
    });

    async function mint(donor, amount, association, blockNumber) {
      return donation.connect(owner).donateToAssociation(association, amount, { value: amount });
    }

    it("should revert when donation contract is not set", async function () {
      await sbt.connect(owner).setDonationContract(zeroAddress);
      await expect(sbt.connect(owner).mint(donor1.address, 100, asso1.address, 1))
        .to.be.revertedWith("Caller is not the Donation contract");
    });
  
    it("should revert with zero donation amount", async function () {
      await expect(mint(donor1.address, 0, asso1.address, 1))
        .to.be.revertedWith("Donation amount must be greater than zero");
    });

    it("should revert with invalid association address", async function () {
      await expect(mint(donor1.address, 100, zeroAddress, 1))
        .to.be.revertedWith("Association is not whitelisted");
    });

    it("should mint successfully with valid parameters", async function () {
      const currentBlock = await ethers.provider.getBlockNumber();
      await expect(mint(donor1.address, 100, asso1.address, currentBlock))
        .to.not.be.reverted;
    });
  
    it("should mint successfully with current block number", async function () {
      const currentBlock = await ethers.provider.getBlockNumber();
      await expect(mint(donor1.address, 100, asso1.address, currentBlock))
        .to.not.be.reverted;
    });
  
    it("should mint successfully with past block number", async function () {
      const currentBlock = await ethers.provider.getBlockNumber();
      await expect(mint(donor1.address, 100, asso1.address, currentBlock - 1))
        .to.not.be.reverted;
    });

    it("should only allow the Donation contract to mint", async function () {
      const amount = ethers.parseEther("1");
      const blockNumber = await ethers.provider.getBlockNumber();

      await expect(
        sbt
          .connect(owner)
          .mint(donor1.address, amount, asso1.address, blockNumber)
      ).to.be.revertedWith("Caller is not the Donation contract");
    });

    it("should mint a new token when a donation is made", async function () {
      const { donation, sbt, asso1, donor1, owner } = await loadFixture(
        deployDonationFixture
      );

      const donationAmount = ethers.parseEther("1");

      // Get initial token balance
      const initialBalance = await sbt.balanceOf(donor1.address);

      // Make a donation
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      // Check new token balance
      const newBalance = await sbt.balanceOf(donor1.address);
      expect(newBalance).to.equal(initialBalance + 1n);

      // Get the minted token
      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens.length).to.be.greaterThan(0);

      const lastTokenId = tokens[tokens.length - 1];

      // Check the token details
      const donationProof = await sbt.getDonationProof(lastTokenId);
      expect(donationProof.amount).to.equal(donationAmount);
      expect(donationProof.association).to.equal(asso1.address);
      expect(donationProof.blockNumber).to.be.greaterThan(0);
    });

    it("should mint a new token and return the correct token ID", async function () {
      const amount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, amount, { value: amount });

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens.length).to.equal(1);
      expect(tokens[0]).to.equal(0); // First token ID should be 0
    });

    it("should correctly store the donation proof", async function () {
      const amount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, amount, { value: amount });

      const tokens = await sbt.getDonorTokens(donor1.address);
      const tokenId = tokens[0];

      const proof = await sbt.getDonationProof(tokenId);
      expect(proof.amount).to.equal(amount);
      expect(proof.association).to.equal(asso1.address);
      expect(proof.blockNumber).to.be.gt(0);
    });

    it("should emit MintAttempt and DonationProofMinted events", async function () {
      const amount = ethers.parseEther("1");
      const donationTx = donation
        .connect(donor1)
        .donateToAssociation(asso1.address, amount, { value: amount });

      await expect(donationTx)
        .to.emit(sbt, "MintAttempt")
        .withArgs(
          await donation.getAddress(),
          await donation.getAddress(),
          donor1.address
        );

      await expect(donationTx)
        .to.emit(sbt, "DonationProofMinted")
        .withArgs(
          donor1.address,
          amount,
          asso1.address,
          await time.latest(),
          await ethers.provider.getBlockNumber(),
          0
        );
    });

    it("should increment token ID for each new mint", async function () {
      const { donation, sbt, asso1, donor1, donor2, owner } = await loadFixture(
        deployDonationFixture
      );

      const donationAmount = ethers.parseEther("1");

      // First donation
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      // Second donation
      await donation
        .connect(donor2)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const tokens1 = await sbt.getDonorTokens(donor1.address);
      const tokens2 = await sbt.getDonorTokens(donor2.address);

      expect(tokens1[0]).to.equal(0n);
      expect(tokens2[0]).to.equal(1n);
    });

    it("should assign the token to the correct donor", async function () {
      const amount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, amount, { value: amount });

      const tokens = await sbt.getDonorTokens(donor1.address);
      const tokenId = tokens[0];

      expect(await sbt.ownerOf(tokenId)).to.equal(donor1.address);
    });

    it("should not allow minting with zero amount", async function () {
      await expect(
        donation
          .connect(donor1)
          .donateToAssociation(asso1.address, 0, { value: 0 })
      ).to.be.revertedWith("Donation amount must be greater than zero");
    });

    it("should have a mint function that can only be called by the Donation contract", async function () {
      const amount = ethers.parseEther("1");
      const blockNumber = await ethers.provider.getBlockNumber();

      // Verify that mint function exists
      expect(sbt.mint).to.be.a("function");

      // Try to call mint directly (should fail)
      await expect(
        sbt
          .connect(owner)
          .mint(donor1.address, amount, asso1.address, blockNumber)
      ).to.be.revertedWith("Caller is not the Donation contract");

      // Donation through the Donation contract should succeed
      await expect(
        donation
          .connect(owner)
          .donateToAssociation(asso1.address, amount, { value: amount })
      ).to.not.be.reverted;
    });
    it("should only allow minting through the Donation contract", async function () {
      const { sbt, asso1, donor1, owner } = await loadFixture(
        deployDonationFixture
      );

      const donationAmount = ethers.parseEther("1");
      const blockNumber = await ethers.provider.getBlockNumber();

      // Try to mint directly (should fail)
      await expect(
        sbt
          .connect(owner)
          .mint(donor1.address, donationAmount, asso1.address, blockNumber)
      ).to.be.revertedWith("Caller is not the Donation contract");
    });
  });

  describe("tokenURI", function () {
    let donation, sbt, owner, asso1, donor1;
    let tokenId;

    beforeEach(async function () {
      ({ donation, sbt, owner, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      ));

      // Make a donation to mint a token
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      // Get the token ID
      const tokens = await sbt.getDonorTokens(donor1.address);
      tokenId = tokens[0];
    });

    it("should return the correct token URI for an existing token", async function () {
      const uri = await sbt.tokenURI(tokenId);
      const baseURI = await sbt.getBaseURI();
      expect(uri).to.equal(baseURI + tokenId.toString());
    });

    it("should revert for a non-existent token", async function () {
      const nonExistentTokenId = 9999;
      await expect(sbt.tokenURI(nonExistentTokenId)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
    });

    it("should update token URI when base URI is changed", async function () {
      const newBaseURI = "https://newexample.com/metadata/";
      await sbt.connect(owner).setBaseURI(newBaseURI);

      const uri = await sbt.tokenURI(tokenId);
      expect(uri).to.equal(newBaseURI + tokenId.toString());
    });

    it("should handle tokenIDs with different lengths correctly", async function () {
      // Mint more tokens to get a two-digit token ID
      const donationAmount = ethers.parseEther("1");
      for (let i = 0; i < 10; i++) {
        await donation
          .connect(donor1)
          .donateToAssociation(asso1.address, donationAmount, {
            value: donationAmount,
          });
      }

      const tokens = await sbt.getDonorTokens(donor1.address);
      const twoDigitTokenId = tokens[tokens.length - 1];

      const uri = await sbt.tokenURI(twoDigitTokenId);
      const baseURI = await sbt.getBaseURI();
      expect(uri).to.equal(baseURI + twoDigitTokenId.toString());
    });

    it("should return correct URI after burning and minting new token", async function () {
      // Burn the token
      await sbt.connect(donor1).burn(tokenId);

      // Mint a new token
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const newTokens = await sbt.getDonorTokens(donor1.address);
      const newTokenId = newTokens[0];

      const uri = await sbt.tokenURI(newTokenId);
      const baseURI = await sbt.getBaseURI();
      expect(uri).to.equal(baseURI + newTokenId.toString());
    });
    it("should return correct URI when base URI is empty", async function () {
      await sbt.connect(owner).setBaseURI("");
      const tokenId = 0; // Assuming this token exists
      expect(await sbt.tokenURI(tokenId)).to.equal("0");
    });
  });

  describe("getDonationProof", function () {
    let donation, sbt, owner, donor1;
    let tokenId;
    let assoCounter = 0;
    let donationAmount;
    let asso;

    beforeEach(async function () {
      ({ donation, sbt, owner, donor1 } = await loadFixture(
        deployDonationFixture
      ));

      // Create a new association for each test
      [, , , asso] = await ethers.getSigners();
      assoCounter++;
      const assoName = `Asso${assoCounter}`;
      const assoAddress = `123 Main St #${assoCounter}`;
      const assoRNA = `RNA${assoCounter}`;

      await donation
        .connect(owner)
        .addAssociation(asso.address, assoName, assoAddress, assoRNA);

      // Make a donation to mint a token
      donationAmount = ethers.parseEther("1");
      const tx = await donation
        .connect(donor1)
        .donateToAssociation(asso.address, donationAmount, {
          value: donationAmount,
        });
      const receipt = await tx.wait();

      // Get the token ID
      const tokens = await sbt.getDonorTokens(donor1.address);
      tokenId = tokens[0];
    });

    it("should return the correct donation proof for an existing token", async function () {
      const proof = await sbt.getDonationProof(tokenId);

      expect(proof.amount).to.equal(donationAmount);
      expect(proof.association).to.equal(asso.address);
      expect(proof.timestamp).to.be.a("bigint");
      expect(proof.timestamp).to.be.greaterThan(0);
      expect(proof.blockNumber).to.be.a("bigint");
      expect(proof.blockNumber).to.be.greaterThan(0);
    });

    it("should revert for a non-existent token", async function () {
      const nonExistentTokenId = 9999;
      await expect(sbt.getDonationProof(nonExistentTokenId)).to.be.revertedWith(
        "Token does not exist"
      );
    });

    it("should return different proofs for different donations", async function () {
      // Make another donation
      const secondDonationAmount = ethers.parseEther("2");
      await donation
        .connect(donor1)
        .donateToAssociation(asso.address, secondDonationAmount, {
          value: secondDonationAmount,
        });

      const tokens = await sbt.getDonorTokens(donor1.address);
      const secondTokenId = tokens[1];

      const firstProof = await sbt.getDonationProof(tokenId);
      const secondProof = await sbt.getDonationProof(secondTokenId);

      expect(firstProof.amount).to.equal(donationAmount);
      expect(secondProof.amount).to.equal(secondDonationAmount);
      expect(secondProof.timestamp).to.be.greaterThan(firstProof.timestamp);
    });

    it("should return the correct proof after multiple donations", async function () {
      // Make multiple donations
      for (let i = 0; i < 5; i++) {
        await donation
          .connect(donor1)
          .donateToAssociation(asso.address, donationAmount, {
            value: donationAmount,
          });
      }

      const tokens = await sbt.getDonorTokens(donor1.address);
      const lastTokenId = tokens[tokens.length - 1];

      const proof = await sbt.getDonationProof(lastTokenId);
      expect(proof.amount).to.equal(donationAmount);
      expect(proof.association).to.equal(asso.address);
    });

    it("should not allow token transfer and should not change the proof", async function () {
      const [, , , , newOwner] = await ethers.getSigners();

      const proofBefore = await sbt.getDonationProof(tokenId);

      // Attempt to transfer the token (should fail)
      await expect(
        sbt
          .connect(donor1)
          .transferFrom(donor1.address, newOwner.address, tokenId)
      ).to.be.revertedWith("SBT tokens are not transferable");

      // Verify that the token is still owned by the original owner
      expect(await sbt.ownerOf(tokenId)).to.equal(donor1.address);

      // Get the proof after the failed transfer attempt
      const proofAfter = await sbt.getDonationProof(tokenId);

      // Verify that the proof hasn't changed
      expect(proofAfter.amount).to.equal(proofBefore.amount);
      expect(proofAfter.association).to.equal(proofBefore.association);
      expect(proofAfter.timestamp).to.equal(proofBefore.timestamp);
      expect(proofAfter.blockNumber).to.equal(proofBefore.blockNumber);
    });
  });

  describe("getDonorTokens", function () {
    let donation, sbt, owner, donor1, donor2, asso;
    let assoCounter = 0;

    beforeEach(async function () {
      ({ donation, sbt, owner, donor1, donor2 } = await loadFixture(
        deployDonationFixture
      ));

      // Create a new association for each test
      [, , , , asso] = await ethers.getSigners(); // Use a different signer for the association
      assoCounter++;
      const assoName = `Asso${assoCounter}`;
      const assoAddress = `123 Main St #${assoCounter}`;
      const assoRNA = `RNA${assoCounter}`;

      await donation
        .connect(owner)
        .addAssociation(asso.address, assoName, assoAddress, assoRNA);
    });

    it("should return all tokens owned by a donor", async function () {
      const { sbt, donation, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      );
      const donationAmount = ethers.parseEther("1");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens.length).to.equal(2);
    });

    it("should return an empty array for a donor with no tokens", async function () {
      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens).to.be.an("array").that.is.empty;
    });

    it("should return correct token IDs for a donor with one token", async function () {
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso.address, donationAmount, {
          value: donationAmount,
        });

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens).to.have.lengthOf(1);
      expect(tokens[0]).to.equal(0n); // First token should have ID 0
    });

    it("should return correct token IDs for a donor with multiple tokens", async function () {
      const donationAmount = ethers.parseEther("1");
      const donationCount = 5;

      for (let i = 0; i < donationCount; i++) {
        await donation
          .connect(donor1)
          .donateToAssociation(asso.address, donationAmount, {
            value: donationAmount,
          });
      }

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens).to.have.lengthOf(donationCount);
      for (let i = 0; i < donationCount; i++) {
        expect(tokens[i]).to.equal(BigInt(i));
      }
    });

    it("should return correct tokens for multiple donors", async function () {
      const donationAmount = ethers.parseEther("1");

      // Donor1 makes 2 donations
      await donation
        .connect(donor1)
        .donateToAssociation(asso.address, donationAmount, {
          value: donationAmount,
        });
      await donation
        .connect(donor1)
        .donateToAssociation(asso.address, donationAmount, {
          value: donationAmount,
        });

      // Donor2 makes 1 donation
      await donation
        .connect(donor2)
        .donateToAssociation(asso.address, donationAmount, {
          value: donationAmount,
        });

      const tokens1 = await sbt.getDonorTokens(donor1.address);
      const tokens2 = await sbt.getDonorTokens(donor2.address);

      expect(tokens1).to.have.lengthOf(2);
      expect(tokens1[0]).to.equal(0n);
      expect(tokens1[1]).to.equal(1n);

      expect(tokens2).to.have.lengthOf(1);
      expect(tokens2[0]).to.equal(2n);
    });

    it("should handle a large number of tokens correctly", async function () {
      const donationAmount = ethers.parseEther("1");
      const donationCount = 100; // Adjust this number based on gas limits and test run time

      for (let i = 0; i < donationCount; i++) {
        await donation
          .connect(donor1)
          .donateToAssociation(asso.address, donationAmount, {
            value: donationAmount,
          });
      }

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens).to.have.lengthOf(donationCount);
      for (let i = 0; i < donationCount; i++) {
        expect(tokens[i]).to.equal(BigInt(i));
      }
    });

    it("should return correct tokens after burning some tokens", async function () {
      const donationAmount = ethers.parseEther("1");
      const donationCount = 5;

      // Make donations
      for (let i = 0; i < donationCount; i++) {
        await donation
          .connect(donor1)
          .donateToAssociation(asso.address, donationAmount, {
            value: donationAmount,
          });
      }

      // Burn some tokens
      await sbt.connect(donor1).burn(1n); // Burn token with ID 1
      await sbt.connect(donor1).burn(3n); // Burn token with ID 3

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens).to.have.lengthOf(3);
      expect(tokens).to.deep.equal([0n, 2n, 4n]);
    });
  });

  describe("burn", function () {
    let donation, sbt, owner, donor1, donor2, asso, asso1;
    let tokenId;
    let assoCounter = 0;

    beforeEach(async function () {
      ({ donation, sbt, owner, donor1, donor2, asso1 } = await loadFixture(
        deployDonationFixture
      ));

      // Create a new association for each test
      [, , , , asso] = await ethers.getSigners();
      assoCounter++;
      const assoName = `Asso${assoCounter}`;
      const assoAddress = `123 Main St #${assoCounter}`;
      const assoRNA = `RNA${assoCounter}`;

      await donation
        .connect(owner)
        .addAssociation(asso.address, assoName, assoAddress, assoRNA);

      // Make a donation to mint a token
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso.address, donationAmount, {
          value: donationAmount,
        });

      // Get the token ID
      const tokens = await sbt.getDonorTokens(donor1.address);
      tokenId = tokens[0];
    });

    it("should burn a token", async function () {
      const { sbt, donation, asso1, donor1 } = await loadFixture(
        deployDonationFixture
      );
      const donationAmount = ethers.parseEther("1");

      // Donate to association
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      // Get donor's tokens and select the first token
      const tokens = await sbt.getDonorTokens(donor1.address);
      const tokenId = tokens[0];

      // Burn the token
      await sbt.connect(donor1).burn(tokenId);

      // Verify that the donation proof is deleted
      await expect(sbt.getDonationProof(tokenId)).to.be.revertedWith(
        "Token does not exist"
      );
    });

    it("should allow the token owner to burn their token", async function () {
      await expect(sbt.connect(donor1).burn(tokenId)).to.not.be.reverted;

      // Check that the token no longer exists
      await expect(sbt.ownerOf(tokenId))
        .to.be.revertedWithCustomError(sbt, "ERC721NonexistentToken")
        .withArgs(tokenId);
    });

    it("should not allow non-owners to burn the token", async function () {
      await expect(sbt.connect(donor2).burn(tokenId)).to.be.revertedWith(
        "Only token owner can burn"
      );
    });

    it("should revert when trying to burn a non-existent token", async function () {
      const nonExistentTokenId = 9999;
      await expect(sbt.connect(donor1).burn(nonExistentTokenId))
        .to.be.revertedWithCustomError(sbt, "ERC721NonexistentToken")
        .withArgs(nonExistentTokenId);
    });

    it("should update the donor's token balance after burning", async function () {
      const balanceBefore = await sbt.balanceOf(donor1.address);
      await sbt.connect(donor1).burn(tokenId);
      const balanceAfter = await sbt.balanceOf(donor1.address);

      expect(balanceAfter).to.equal(balanceBefore - 1n);
    });

    it("should remove the burned token from getDonorTokens", async function () {
      await sbt.connect(donor1).burn(tokenId);
      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens).to.not.include(tokenId);
    });

    it("should emit a Transfer event to the zero address when burning", async function () {
      await expect(sbt.connect(donor1).burn(tokenId))
        .to.emit(sbt, "Transfer")
        .withArgs(donor1.address, ethers.ZeroAddress, tokenId);
    });

    it("should allow burning multiple tokens", async function () {
      // Mint another token
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso.address, donationAmount, {
          value: donationAmount,
        });

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens.length).to.equal(2);

      // Burn both tokens
      await sbt.connect(donor1).burn(tokens[0]);
      await sbt.connect(donor1).burn(tokens[1]);

      const remainingTokens = await sbt.getDonorTokens(donor1.address);
      expect(remainingTokens.length).to.equal(0);
    });
    it("should correctly return tokens after burning some in the middle", async function () {
      // Mint 4 tokens
      for (let i = 0; i < 4; i++) {
        await donation.connect(donor1).donateToAssociation(asso1.address, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      }

      // Burn tokens 1 and 3
      await sbt.connect(donor1).burn(1);
      await sbt.connect(donor1).burn(3);

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens).to.deep.equal([0n, 2n, 4n]);
    });
  });

  describe("_exists and supportsInterface", function () {
    let donation, sbt, owner, donor1, asso;
    let tokenId;

    beforeEach(async function () {
      ({ donation, sbt, owner, donor1 } = await loadFixture(
        deployDonationFixture
      ));

      [, , , , asso] = await ethers.getSigners();
      await donation
        .connect(owner)
        .addAssociation(asso.address, "Asso1", "123 Main St", "RNA123");

      // Mint a token
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso.address, donationAmount, {
          value: donationAmount,
        });

      const tokens = await sbt.getDonorTokens(donor1.address);
      tokenId = tokens[0];
    });

    describe("Token existence", function () {
      it("should recognize an existing token", async function () {
        expect(await sbt.ownerOf(tokenId)).to.equal(donor1.address);
      });

      it("should not recognize a non-existent token", async function () {
        const nonExistentTokenId = 9999;
        await expect(sbt.ownerOf(nonExistentTokenId))
          .to.be.revertedWithCustomError(sbt, "ERC721NonexistentToken")
          .withArgs(nonExistentTokenId);
      });

      it("should not recognize a burned token", async function () {
        await sbt.connect(donor1).burn(tokenId);
        await expect(sbt.ownerOf(tokenId))
          .to.be.revertedWithCustomError(sbt, "ERC721NonexistentToken")
          .withArgs(tokenId);
      });
    });

    it("should not support ERC20 interface", async function () {
      const ERC20InterfaceId = "0x36372b07";
      expect(await sbt.supportsInterface(ERC20InterfaceId)).to.be.false;
    });

    it("should support IERC165 interface", async function () {
      const IERC165InterfaceId = "0x01ffc9a7";
      expect(await sbt.supportsInterface(IERC165InterfaceId)).to.be.true;
    });

    describe("supportsInterface", function () {
      it("should support ERC721 interface", async function () {
        const ERC721InterfaceId = "0x80ac58cd";
        expect(await sbt.supportsInterface(ERC721InterfaceId)).to.be.true;
      });

      it("should support ERC721Metadata interface", async function () {
        const ERC721MetadataInterfaceId = "0x5b5e139f";
        expect(await sbt.supportsInterface(ERC721MetadataInterfaceId)).to.be
          .true;
      });

      it("should support ERC165 interface", async function () {
        const ERC165InterfaceId = "0x01ffc9a7";
        expect(await sbt.supportsInterface(ERC165InterfaceId)).to.be.true;
      });

      it("should not support a random interface", async function () {
        const randomInterfaceId = "0x12345678";
        expect(await sbt.supportsInterface(randomInterfaceId)).to.be.false;
      });
    });
  });

  describe("Transfer Restrictions", function () {
    let sbt, donation, owner, donor1, donor2, asso1;
    let tokenId;

    beforeEach(async function () {
      ({ sbt, donation, owner, donor1, donor2, asso1 } = await loadFixture(
        deployDonationFixture
      ));

      // Check if the association is already whitelisted
      const associationDetails = await donation.getAssociationDetails(
        asso1.address
      );
      if (!associationDetails[3]) {
        // Assuming the fourth element is the whitelisted status
        // Whitelist the association only if it's not already whitelisted
        await donation
          .connect(owner)
          .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      }

      // Make a donation to mint a token
      const donationAmount = ethers.parseEther("1");
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });

      // Get the token ID
      const tokens = await sbt.getDonorTokens(donor1.address);
      tokenId = tokens[0];
    });

    it("should not allow transfer to contract address", async function () {
      const donationAddress = await donation.getAddress();
      expect(donationAddress).to.be.properAddress;
      
      await expect(
        sbt.connect(donor1).transferFrom(donor1.address, donationAddress, tokenId)
      ).to.be.revertedWith("SBT tokens are not transferable");
    });

    it("should not allow approval to zero address", async function () {
      const tokenId = 0; // Assuming this token exists
      await expect(
        sbt.connect(donor1).approve(ethers.ZeroAddress, tokenId)
      ).to.be.revertedWith("SBT tokens do not support approvals");
    });

    it("should not allow transferFrom", async function () {
      await expect(
        sbt
          .connect(donor1)
          .transferFrom(donor1.address, donor2.address, tokenId)
      ).to.be.revertedWith("SBT tokens are not transferable");
    });

    it("should not allow safeTransferFrom without data", async function () {
      await expect(
        sbt
          .connect(donor1)
          ["safeTransferFrom(address,address,uint256)"](
            donor1.address,
            donor2.address,
            tokenId
          )
      ).to.be.revertedWith("SBT tokens are not transferable");
    });

    it("should not allow safeTransferFrom with data", async function () {
      await expect(
        sbt
          .connect(donor1)
          ["safeTransferFrom(address,address,uint256,bytes)"](
            donor1.address,
            donor2.address,
            tokenId,
            "0x"
          )
      ).to.be.revertedWith("SBT tokens are not transferable");
    });

    it("should not allow approve", async function () {
      await expect(
        sbt.connect(donor1).approve(donor2.address, tokenId)
      ).to.be.revertedWith("SBT tokens do not support approvals");
    });

    it("should not allow setApprovalForAll", async function () {
      await expect(
        sbt.connect(donor1).setApprovalForAll(donor2.address, true)
      ).to.be.revertedWith("SBT tokens do not support approvals");
    });

    it("should not allow owner to transfer", async function () {
      await expect(
        sbt.connect(owner).transferFrom(donor1.address, donor2.address, tokenId)
      ).to.be.revertedWith("SBT tokens are not transferable");
    });

    it("should not change ownership after transfer attempt", async function () {
      await expect(
        sbt
          .connect(donor1)
          .transferFrom(donor1.address, donor2.address, tokenId)
      ).to.be.revertedWith("SBT tokens are not transferable");

      expect(await sbt.ownerOf(tokenId)).to.equal(donor1.address);
    });
  });
});
