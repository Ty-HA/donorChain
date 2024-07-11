// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DonationBadgeNFT
/// @author Ty HA
/// @notice This contract is used to mint tokens representing donation badges as rewarding for donors
contract DonationBadgeNFT is ERC721, Ownable, ReentrancyGuard {
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

    event DonationContractSet(address indexed newDonationContract);
    event BadgeMinted(
        address indexed donor,
        uint256 indexed tokenId,
        Tier tier
    );
    event TierURIUpdated(Tier indexed tier, string newURI);
    event DonorTierUpdated(address indexed donor, Tier oldTier, Tier newTier);

    constructor() ERC721("DonationBadge", "DBADGE") Ownable(msg.sender) {
        string
            memory baseURI = "ipfs://Qme5rXhq2i3hfhEoM8YbUQfu96YDQ89mhBgUufKPga6AUN/metadata/";
        tierURIs[Tier.Bronze] = string(
            abi.encodePacked(baseURI, "bronze.json")
        );
        tierURIs[Tier.Silver] = string(
            abi.encodePacked(baseURI, "silver.json")
        );
        tierURIs[Tier.Gold] = string(abi.encodePacked(baseURI, "gold.json"));
    }

    modifier onlyDonationContract() {
        require(
            msg.sender == donationContract,
            "Caller is not the Donation contract"
        );
        _;
    }

    /// @notice Set the address of the donation contract
    /// @param _donationContract The address of the donation contract
    /// @dev This function can only be called by the contract owner
    function setDonationContract(address _donationContract) external onlyOwner {
        require(
            _donationContract != address(0),
            "Invalid donation contract address"
        );
        donationContract = _donationContract;
        emit DonationContractSet(donationContract);
    }

    /// @notice Mint a badge for a donor
    /// @param _donor  The address of the donor
    /// @param _totalDonated  The total amount donated by the donor
    /// @return The token ID of the minted badge
    function mintBadge(
        address _donor,
        uint256 _totalDonated
    ) external nonReentrant onlyDonationContract returns (uint256) {
        require(_donor != address(0), "Invalid donor address");
        Tier newTier = getTierForAmount(_totalDonated);
        Tier oldTier = donorHighestTier[_donor];
        require(
            newTier > donorHighestTier[_donor],
            "Donor already has this tier or higher"
        );

        uint256 newTokenId = _nextTokenId++;

        badges[newTokenId] = Badge(newTier, block.timestamp);
        donorHighestTier[_donor] = newTier;

        emit DonorTierUpdated(_donor, oldTier, newTier);

        _safeMint(_donor, newTokenId);

        emit BadgeMinted(_donor, newTokenId, newTier);

        return newTokenId;
    }

    /// @notice Get the URI of a badge token
    /// @param _tokenId  The token ID of the badge
    /// @return The URI of the badge token
    function tokenURI(
        uint256 _tokenId
    ) public view override returns (string memory) {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return tierURIs[badges[_tokenId].tier];
    }

    // ::::::::::::: SETTERS ::::::::::::: //

    /// @notice Set the URI for a tier
    /// @param _tier  The tier for which to set the URI
    /// @param _uri  The new URI for the tier
    function setTierURI(Tier _tier, string memory _uri) external onlyOwner {
        tierURIs[_tier] = _uri;
        emit TierURIUpdated(_tier, _uri);
    }

    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Get the tier for a donation amount
    /// @param _amount  The donation amount
    /// @return The tier corresponding to the donation amount
    function getTierForAmount(uint256 _amount) public pure returns (Tier) {
        if (_amount >= GOLD_THRESHOLD) {
            return Tier.Gold;
        } else if (_amount >= SILVER_THRESHOLD) {
            return Tier.Silver;
        } else if (_amount >= BRONZE_THRESHOLD) {
            return Tier.Bronze;
        } else {
            return Tier.None;
        }
    }

    /// @notice Get the badges owned by a donor
    /// @param _donor  The address of the donor
    /// @return An array of token IDs representing the badges owned by the donor
    function getDonorBadges(
        address _donor
    ) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(_donor);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 counter = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_exists(i) && ownerOf(i) == _donor) {
                tokenIds[counter] = i;
                counter++;
            }
        }
        return tokenIds;
    }

    /// @notice Check if a badge exists
    /// @param _tokenId  The token ID of the badge
    /// @return A boolean indicating if the badge exists
    function _exists(uint256 _tokenId) internal view returns (bool) {
        return _ownerOf(_tokenId) != address(0);
    }

    /// @notice Get the details of a badge
    /// @param _tokenId  The token ID of the badge
    function getBadgeDetails(
        uint256 _tokenId
    ) external view returns (Tier tier, uint256 timestamp) {
        require(_exists(_tokenId), "Badge does not exist");
        Badge memory badge = badges[_tokenId];
        return (badge.tier, badge.timestamp);
    }

    /// @notice Get the highest tier owned by a donor
    /// @param _donor  The address of the donor
    /// @return The highest tier owned by the donor
    function getDonorHighestTier(address _donor) external view returns (Tier) {
        return donorHighestTier[_donor];
    }

    /// @notice Get the name of a tier
    /// @param _tier  The tier
    /// @return The name of the tier
    function getTierName(Tier _tier) public pure returns (string memory) {
        if (_tier == Tier.Gold) return "Gold";
        if (_tier == Tier.Silver) return "Silver";
        if (_tier == Tier.Bronze) return "Bronze";
        return "None";
    }

    // ::::::::::::: TRANSFER OVERRIDE ::::::::::::: //

    /// @notice block safe transfers with data
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override(ERC721) {
        revert("SBT tokens are not transferable");
    }

    /// @notice block native transfers
    function transferFrom(
        address,
        address,
        uint256
    ) public virtual override(ERC721) {
        revert("SBT tokens are not transferable");
    }

    /// @notice block approvals
    function approve(address, uint256) public virtual override(ERC721) {
        revert("SBT tokens do not support approvals");
    }

    /// @notice block setApprovalForAll
    function setApprovalForAll(address, bool) public virtual override(ERC721) {
        revert("SBT tokens do not support approvals");
    }

    /// @notice Burn a token
    /// @param _tokenId The token ID to burn
    function burn(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Only token owner can burn");
        require(_exists(_tokenId), "Badge does not exist");
        _burn(_tokenId);
        delete badges[_tokenId];
    }
}
