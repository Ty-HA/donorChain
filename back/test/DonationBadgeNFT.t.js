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
        
        await donation.connect(donor1).donateToAssociation(asso1.address, ethers.parseEther("0.5"), { value: ethers.parseEther("0.5") });

        const badges = await badge.getDonorBadges(donor1.address);
        expect(badges.length).to.be.greaterThan(0, "No badges found for the donor");

        const badgeId = badges[0];

        // get the token URI
        const tokenUri = await badge.tokenURI(badgeId);
        console.log("Token URI:", tokenUri); // Afficher l'URI pour vérifier

        expect(tokenUri).to.equal("ipfs://Qme5rXhq2i3hfhEoM8YbUQfu96YDQ89mhBgUufKPga6AUN/metadata/silver.json");
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
});
