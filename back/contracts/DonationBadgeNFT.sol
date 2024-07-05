// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DonationBadgeNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    address public donationContract;

    enum Tier {
        None,
        Bronze,
        Silver,
        Gold
    }

    struct Badge {
        Tier tier;
        uint256 timestamp;
    }

    mapping(uint256 => Badge) public badges;
    mapping(address => Tier) public donorHighestTier;
    mapping(Tier => string) public tierURIs;

    // Définir les seuils pour chaque tier
    uint256 public constant BRONZE_THRESHOLD = 0.1 ether;
    uint256 public constant SILVER_THRESHOLD = 0.5 ether;
    uint256 public constant GOLD_THRESHOLD = 1 ether;

    event BadgeMinted(address indexed donor, uint256 indexed tokenId, Tier tier);
    event TierURIUpdated(Tier indexed tier, string newURI);

    constructor() ERC721("DonationBadge", "DBADGE") Ownable(msg.sender) {
        tierURIs[Tier.Bronze] = "https://example.com/badges/bronze.json";
        tierURIs[Tier.Silver] = "https://example.com/badges/silver.json";
        tierURIs[Tier.Gold] = "https://example.com/badges/gold.json";
    }

    modifier onlyDonationContract() {
        require(msg.sender == donationContract, "Caller is not the Donation contract");
        _;
    }

    function setDonationContract(address _donationContract) external onlyOwner {
        donationContract = _donationContract;
    }

    function mintBadge(address donor, uint256 totalDonated) external onlyDonationContract returns (uint256) {
        Tier newTier = getTierForAmount(totalDonated);
        require(newTier > donorHighestTier[donor], "Donor already has this tier or higher");

        uint256 newTokenId = _nextTokenId++;
        _safeMint(donor, newTokenId);
        badges[newTokenId] = Badge(newTier, block.timestamp);
        donorHighestTier[donor] = newTier;

        emit BadgeMinted(donor, newTokenId, newTier);

        return newTokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return tierURIs[badges[tokenId].tier];
    }

    // ::::::::::::: SETTERS ::::::::::::: //
    function setTierURI(Tier tier, string memory uri) external onlyOwner {
        tierURIs[tier] = uri;
        emit TierURIUpdated(tier, uri);
    }

    // ::::::::::::: GETTERS ::::::::::::: //

    function getTierForAmount(uint256 amount) public pure returns (Tier) {
        if (amount >= GOLD_THRESHOLD) {
            return Tier.Gold;
        } else if (amount >= SILVER_THRESHOLD) {
            return Tier.Silver;
        } else if (amount >= BRONZE_THRESHOLD) {
            return Tier.Bronze;
        } else {
            return Tier.None;
        }
    }

    function getDonorBadges(address donor) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(donor);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 counter = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_exists(i) && ownerOf(i) == donor) {
                tokenIds[counter] = i;
                counter++;
            }
        }
        return tokenIds;
    }

    function getBadgeDetails(uint256 tokenId) external view returns (Tier tier, uint256 timestamp) {
        require(_exists(tokenId), "Badge does not exist");
        Badge memory badge = badges[tokenId];
        return (badge.tier, badge.timestamp);
    }

    function getDonorHighestTier(address donor) external view returns (Tier) {
        return donorHighestTier[donor];
    }

    function getTierName(Tier tier) public pure returns (string memory) {
        if (tier == Tier.Gold) return "Gold";
        if (tier == Tier.Silver) return "Silver";
        if (tier == Tier.Bronze) return "Bronze";
        return "None";
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _nextTokenId && tokenId != 0;
    }
}