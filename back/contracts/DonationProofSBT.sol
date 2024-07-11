// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title DonationProofSBT
/// @author Ty HA
/// @notice This contract is used to mint tokens representing donation proofs non transferable
contract DonationProofSBT is
    ERC721,
    ERC721URIStorage,
    ReentrancyGuard,
    Ownable
{
    using Strings for uint;
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    struct DonationProof {
        uint256 amount;
        address association;
        uint256 timestamp;
        uint256 blockNumber;
    }

    address public donationContract;
    event DonationContractSet(
        address indexed caller,
        address indexed donationContract
    );
    event MintAttempt(
        address indexed caller,
        address indexed donationContract,
        address indexed donor
    );

    event DonationProofMinted(
        address indexed donor,
        uint256 amount,
        address indexed association,
        uint256 timestamp,
        uint256 blockNumber,
        uint256 tokenId
    );

    modifier onlyDonationContract() {
        require(
            msg.sender == donationContract,
            "Caller is not the Donation contract"
        );
        _;
    }

    mapping(uint256 => DonationProof) public donationProofs;

    constructor() ERC721("DonationProof", "DPF") Ownable(msg.sender) {
        _baseTokenURI = "https://rose-written-jellyfish-653.mypinata.cloud/ipfs/QmX9NEQtAUtX1wUZHzhDRe7XE1uYUBMBxN5waFYLgMxaFp?pinataGatewayToken=s0BFC594wAJX3O6PQb7zBWU7ya34HL1dMZyATFnfWqGSfskmg-F6GmXEzAQCV4By";
    }

    /// @notice Set the donation contract address
    /// @param _donationContract The donation contract address
    /// @dev This function can only be called by the contract owner
    function setDonationContract(address _donationContract) external onlyOwner {
        require(
            _donationContract != address(0),
            "Invalid donation contract address"
        );
        donationContract = _donationContract;
        emit DonationContractSet(msg.sender, _donationContract);
    }

    /// @notice Sets the base URI for the metadata
    /// @param _newBaseURI The new base URI
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        _baseTokenURI = _newBaseURI;
    }

    // Add this function to your DonationProofSBT.sol contract
    /// @notice Gets the current base URI for the metadata
    /// @return The current base URI
    function getBaseURI() external view returns (string memory) {
        return _baseURI();
    }

    /// @notice Mint a new token with the donation proof
    /// @param _donor The donor address
    /// @param _amount The donation amount
    /// @param _association The association address
    /// @param _blockNumber The block number of the donation
    /// @return The token ID
    function mint(
        address _donor,
        uint256 _amount,
        address _association,
        uint256 _blockNumber
    ) external nonReentrant onlyDonationContract returns (uint256) {
        require(_donor != address(0), "Invalid donor address");
        require(donationContract != address(0), "Donation contract not set");
        require(_amount > 0, "Donation amount must be greater than 0");
        require(_association != address(0), "Invalid association address");
        require(
            _blockNumber <= block.number,
            "Block number must be in the past"
        );

        emit MintAttempt(msg.sender, donationContract, _donor);

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Update state before external interactions
        donationProofs[tokenId] = DonationProof(
            _amount,
            _association,
            block.timestamp,
            _blockNumber
        );

        // External call
        _safeMint(_donor, tokenId);

        emit DonationProofMinted(
            _donor,
            _amount,
            _association,
            block.timestamp,
            _blockNumber,
            tokenId
        );

        return tokenId;
    }

    /// @notice Returns the full URI for a given token's metadata
    /// @param _tokenId The token ID
    /// @return Full URI for the token's metadata
    function tokenURI(
        uint256 _tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return string(abi.encodePacked(_baseURI(), _tokenId.toString()));
    }

    /// @notice Returns the base URI for the metadata
    /// @return The base URI
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Returns the donation proof for a given token ID
    /// @param _tokenId The token ID
    /// @return The donation proof
    function getDonationProof(
        uint256 _tokenId
    ) external view returns (DonationProof memory) {
        require(_exists(_tokenId), "Token does not exist");
        return donationProofs[_tokenId];
    }

    /// @notice Returns all the tokens owned by the donor
    /// @param _donor The donor address
    /// @return An array of token IDs owned by the donor
    function getDonorTokens(
        address _donor
    ) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(_donor);
        uint256[] memory tokensId = new uint256[](tokenCount);
        uint256 index = 0;
        for (uint256 i = 0; i < _tokenIdCounter && index < tokenCount; i++) {
            if (_exists(i) && ownerOf(i) == _donor) {
                tokensId[index] = i;
                index++;
            }
        }
        return tokensId;
    }

    // ::::::::::::: TRANSFER OVERRIDE ::::::::::::: //

    /// @notice block safe transfers with data
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override(ERC721, IERC721) {
        revert("SBT tokens are not transferable");
    }

    /// @notice block native transfers
    function transferFrom(
        address,
        address,
        uint256
    ) public virtual override(ERC721, IERC721) {
        revert("SBT tokens are not transferable");
    }

    /// @notice block approvals
    function approve(
        address,
        uint256
    ) public virtual override(ERC721, IERC721) {
        revert("SBT tokens do not support approvals");
    }

    /// @notice block setApprovalForAll
    function setApprovalForAll(
        address,
        bool
    ) public virtual override(ERC721, IERC721) {
        revert("SBT tokens do not support approvals");
    }

    /// @notice Burn a token
    /// @param _tokenId The token ID to burn
    function burn(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Only token owner can burn");
        require(_exists(_tokenId), "Token does not exist");
        _burn(_tokenId);
        delete donationProofs[_tokenId];
    }

    /// @notice Check if a token exists
    /// @return True if the token exists, false otherwise
    function _exists(uint256 _tokenId) internal view returns (bool) {
        return _ownerOf(_tokenId) != address(0);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
