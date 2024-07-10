const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonationBadgeNFT", function () {
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

  it("should deploy the DonationBadgeNFT contract successfully", async function () {
    const { badge } = await loadFixture(deployDonationFixture);
    expect(await badge.name()).to.equal("DonationBadge");
    expect(await badge.symbol()).to.equal("DBADGE");
  });

  it("should set the DonationBadgeNFT contract address", async function () {
    const { badge, donation } = await loadFixture(deployDonationFixture);
    expect(await badge.donationContract()).to.equal(
      await donation.getAddress()
    );
  });

  describe("onlyDonationContract modifier", function () {
    it("should not allow non-donation contract address to call restricted function", async function () {
      const { badge, owner, asso1 } = await loadFixture(deployDonationFixture);

      // Assuming the custom error is something like UnauthorizedCaller and is emitted when the check fails
      await expect(badge.connect(asso1).setDonationContract(asso1.address))
        .to.be.revertedWithCustomError(badge, "OwnableUnauthorizedAccount")
        .withArgs(asso1.address);

      // Verify that owner can still call setDonationContract
      await badge.connect(owner).setDonationContract(owner.address);
      const newDonationContract = await badge.donationContract();
      expect(newDonationContract).to.equal(owner.address);
    });
  });

  describe("mintBadge function", function () {
    let donation, badge, owner, donor1, donor2, asso1;

    beforeEach(async function () {
      ({ donation, badge, owner, donor1, donor2, asso1 } = await loadFixture(
        deployDonationFixture
      ));
    });

    it("should only allow the Donation contract to mintBadge", async function () {
      const totalDonated = ethers.parseEther("1");

      await expect(
        badge.connect(owner).mintBadge(donor1.getAddress(), totalDonated)
      ).to.be.revertedWith("Caller is not the Donation contract");
    });

    it("should mint a Bronze badge when donation reaches the Bronze threshold", async function () {
      const totalDonated = ethers.parseEther("0.1"); // Bronze threshold

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, totalDonated, {
          value: totalDonated,
        });

      expect(await badge.balanceOf(donor1.address)).to.equal(1);
      expect(await badge.getDonorHighestTier(donor1.address)).to.equal(1);
    });

    it("should mint a Silver badge when donation reaches the Silver threshold", async function () {
      const totalDonated = ethers.parseEther("0.5"); // Silver threshold

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, totalDonated, {
          value: totalDonated,
        });

      expect(await badge.balanceOf(donor1.address)).to.equal(1);
      expect(await badge.getDonorHighestTier(donor1.address)).to.equal(2); // 2 represents Silver tier
    });

    it("should mint a Gold badge when donation reaches the Gold threshold", async function () {
      const totalDonated = ethers.parseEther("1"); // Gold threshold

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, totalDonated, {
          value: totalDonated,
        });

      expect(await badge.balanceOf(donor1.address)).to.equal(1);
      expect(await badge.getDonorHighestTier(donor1.address)).to.equal(3); // 3 represents Gold tier
    });

    it("should not mint a new badge if the donor already has a higher tier", async function () {
      // First, mint a Gold badge
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, ethers.parseEther("1"), {
          value: ethers.parseEther("1"),
        });

      // Try to mint a Silver badge
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, ethers.parseEther("0.5"), {
          value: ethers.parseEther("0.5"),
        });

      expect(await badge.balanceOf(donor1.address)).to.equal(1);
      expect(await badge.getDonorHighestTier(donor1.address)).to.equal(3);
    });

    it("should mint a new badge if the donor reaches a higher tier", async function () {
      // First, mint a Bronze badge
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, ethers.parseEther("0.1"), {
          value: ethers.parseEther("0.1"),
        });

      // Then, mint a Gold badge
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, ethers.parseEther("1"), {
          value: ethers.parseEther("1"),
        });

      expect(await badge.balanceOf(donor1.address)).to.equal(2);
      expect(await badge.getDonorHighestTier(donor1.address)).to.equal(3);
    });

    it("should return the correct token ID", async function () {
      const totalDonated = ethers.parseEther("0.1");

      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, totalDonated, {
          value: totalDonated,
        });
      await donation
        .connect(donor2)
        .donateToAssociation(asso1.address, totalDonated, {
          value: totalDonated,
        });

      const donor1Tokens = await badge.getDonorBadges(donor1.address);
      const donor2Tokens = await badge.getDonorBadges(donor2.address);

      expect(donor1Tokens[0]).to.equal(0);
      expect(donor2Tokens[0]).to.equal(1);
    });
  });
  describe("DonationBadgeNFT additional functions", function () {
    let donation, badge, owner, donor1, donor2, asso1;

    beforeEach(async function () {
      ({ donation, badge, owner, donor1, donor2, asso1 } = await loadFixture(
        deployDonationFixture
      ));
      // Ensure the association is whitelisted
      if (!(await donation.associations(asso1.address)).whitelisted) {
        await donation
          .connect(owner)
          .addAssociation(asso1.address, "Asso1", "123 Main St", "RNA123");
      }
    });

    describe("setTierURI", function () {
      it("should return the correct URI for a minted badge", async function () {
        await donation
          .connect(donor1)
          .donateToAssociation(asso1.address, ethers.parseEther("0.5"), {
            value: ethers.parseEther("0.5"),
          });

        const badges = await badge.getDonorBadges(donor1.address);
        expect(badges.length).to.be.greaterThan(
          0,
          "No badges found for the donor"
        );

        const badgeId = badges[0];

        // get the token URI
        const tokenUri = await badge.tokenURI(badgeId);
        console.log("Token URI:", tokenUri); // Afficher l'URI pour vérifier

        expect(tokenUri).to.equal(
          "ipfs://Qme5rXhq2i3hfhEoM8YbUQfu96YDQ89mhBgUufKPga6AUN/metadata/silver.json"
        );
      });
    });

    describe("setTierURI", function () {
      it("should allow owner to set tier URI", async function () {
        const newURI = "https://example.com/bronze";
        await expect(badge.connect(owner).setTierURI(1, newURI))
          .to.emit(badge, "TierURIUpdated")
          .withArgs(1, newURI);
      });

      it("should not allow non-owner to set tier URI", async function () {
        await expect(
          badge.connect(donor1).setTierURI(1, "https://example.com/bronze")
        ).to.be.revertedWithCustomError(badge, "OwnableUnauthorizedAccount");
      });
    });

    describe("getTierForAmount", function () {
      it("should return correct tier for different amounts", async function () {
        expect(
          await badge.getTierForAmount(ethers.parseEther("0.05"))
        ).to.equal(0); // None
        expect(await badge.getTierForAmount(ethers.parseEther("0.1"))).to.equal(
          1
        ); // Bronze
        expect(await badge.getTierForAmount(ethers.parseEther("0.5"))).to.equal(
          2
        ); // Silver
        expect(await badge.getTierForAmount(ethers.parseEther("1"))).to.equal(
          3
        ); // Gold
      });
    });

    describe("getDonorBadges", function () {
      it("should return correct badges for a donor", async function () {
        await donation
          .connect(donor1)
          .donateToAssociation(asso1.address, ethers.parseEther("0.1"), {
            value: ethers.parseEther("0.1"),
          });
        await donation
          .connect(donor1)
          .donateToAssociation(asso1.address, ethers.parseEther("1"), {
            value: ethers.parseEther("1"),
          });

        const badges = await badge.getDonorBadges(donor1.address);
        expect(badges.length).to.equal(2);
      });
    });

    describe("getBadgeDetails", function () {
      it("should return correct details for a badge", async function () {
        // Simuler une donation de 0.5 ether
        await donation
          .connect(donor1)
          .donateToAssociation(asso1.address, ethers.parseEther("0.5"), {
            value: ethers.parseEther("0.5"),
          });

        // Récupérer les badges du donateur
        const badges = await badge.getDonorBadges(donor1.address);
        console.log("Badges:", badges); // Afficher les badges pour vérifier

        // Utiliser l'ID de badge retourné par getDonorBadges
        const badgeId = badges[0];
        console.log("Badge ID:", badgeId); // Afficher l'ID du badge pour vérifier

        // Récupérer les détails du badge
        const badgeDetails = await badge.getBadgeDetails(badgeId);
        const [tier, timestamp] = badgeDetails;

        // Vérifier que les détails du badge sont corrects
        expect(tier).to.equal(2); // Silver
        expect(timestamp).to.be.gt(0);
      });

      it("should revert for non-existent badge", async function () {
        await expect(badge.getBadgeDetails(999)).to.be.revertedWith(
          "Badge does not exist"
        );
      });
    });

    describe("getDonorHighestTier", function () {
      it("should return the highest tier for a donor", async function () {
        await donation
          .connect(donor1)
          .donateToAssociation(asso1.address, ethers.parseEther("0.1"), {
            value: ethers.parseEther("0.1"),
          });
        await donation
          .connect(donor1)
          .donateToAssociation(asso1.address, ethers.parseEther("1"), {
            value: ethers.parseEther("1"),
          });

        expect(await badge.getDonorHighestTier(donor1.address)).to.equal(3); // Gold
      });

      it("should return None for donor with no badges", async function () {
        expect(await badge.getDonorHighestTier(donor2.address)).to.equal(0); // None
      });
    });

    describe("getTierName", function () {
      it("should return correct tier names", async function () {
        expect(await badge.getTierName(0)).to.equal("None");
        expect(await badge.getTierName(1)).to.equal("Bronze");
        expect(await badge.getTierName(2)).to.equal("Silver");
        expect(await badge.getTierName(3)).to.equal("Gold");
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
        sbt
          .connect(donor1)
          .transferFrom(donor1.address, donationAddress, tokenId)
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

  describe("Transfer and approval restrictions", function () {
    let badge, donor1, donor2, tokenId;
  
    beforeEach(async function () {
      const { badge: badgeContract, donation, asso1, donor1: donor1Address, donor2: donor2Address } = await loadFixture(deployDonationFixture);
      badge = badgeContract;
      donor1 = donor1Address;
      donor2 = donor2Address;
  
      // Mint a badge for donor1
      const donationAmount = ethers.parseEther("1");
      await donation.connect(donor1).donateToAssociation(asso1.address, donationAmount, { value: donationAmount });
      const tokens = await badge.getDonorBadges(donor1.address);
      tokenId = tokens[0];
    });
  
    it("should not allow safeTransferFrom", async function () {
      await expect(badge.connect(donor1)["safeTransferFrom(address,address,uint256)"](donor1.address, donor2.address, tokenId))
        .to.be.revertedWith("SBT tokens are not transferable");
    });
  
    it("should not allow safeTransferFrom with data", async function () {
      await expect(badge.connect(donor1)["safeTransferFrom(address,address,uint256,bytes)"](donor1.address, donor2.address, tokenId, "0x"))
        .to.be.revertedWith("SBT tokens are not transferable");
    });
  
    it("should not allow transferFrom", async function () {
      await expect(badge.connect(donor1).transferFrom(donor1.address, donor2.address, tokenId))
        .to.be.revertedWith("SBT tokens are not transferable");
    });
  
    it("should not allow approve", async function () {
      await expect(badge.connect(donor1).approve(donor2.address, tokenId))
        .to.be.revertedWith("SBT tokens do not support approvals");
    });
  
    it("should not allow setApprovalForAll", async function () {
      await expect(badge.connect(donor1).setApprovalForAll(donor2.address, true))
        .to.be.revertedWith("SBT tokens do not support approvals");
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
      const { badge, donation, asso1, donor1 } = await loadFixture(deployDonationFixture);
      const donationAmount = ethers.parseEther("1");
    
      // Donate to association
      await donation
        .connect(donor1)
        .donateToAssociation(asso1.address, donationAmount, {
          value: donationAmount,
        });
    
      // Get donor's tokens and select the first token
      const tokens = await badge.getDonorBadges(donor1.address);
      expect(tokens.length).to.be.greaterThan(0, "No badge minted");
      const tokenId = tokens[0];
    
      // Verify the badge exists before burning
      const [tierBefore, ] = await badge.getBadgeDetails(tokenId);
      expect(tierBefore).to.not.equal(0, "Badge should exist before burning");
    
      // Burn the token
      await badge.connect(donor1).burn(tokenId);
    
      // Verify that the badge is deleted
      await expect(badge.ownerOf(tokenId)).to.be.reverted;
      await expect(badge.getBadgeDetails(tokenId)).to.be.revertedWith("Badge does not exist");
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
        await donation
          .connect(donor1)
          .donateToAssociation(asso1.address, ethers.parseEther("1"), {
            value: ethers.parseEther("1"),
          });
      }

      // Burn tokens 1 and 3
      await sbt.connect(donor1).burn(1);
      await sbt.connect(donor1).burn(3);

      const tokens = await sbt.getDonorTokens(donor1.address);
      expect(tokens).to.deep.equal([0n, 2n, 4n]);
    });
  });
});
