// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title DonationProofSBT
/// @author Ty HA
/// @notice This contract is used to mint tokens representing donation proofs
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
        _baseTokenURI = "https://rose-written-jellyfish-653.mypinata.cloud/ipfs/QmbQzHVt2xdJ1vDRMjAoyF6eaLH3WRY3D3mgqTW1MWdxuY/";
    }

    /// @notice Set the donation contract address
    /// @param _donationContract The donation contract address
    function setDonationContract(address _donationContract) external onlyOwner {
        donationContract = _donationContract;
        emit DonationContractSet(msg.sender, _donationContract);
    }

    /// @notice Sets the base URI for the metadata
    /// @param _newBaseURI The new base URI
    function setBaseURI(string memory _newBaseURI) public {
        _baseTokenURI = _newBaseURI;
    }

    // Add this function to your DonationProofSBT.sol contract
    /// @notice Gets the current base URI for the metadata
    /// @return The current base URI
    function getBaseURI() public view returns (string memory) {
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
    ) external onlyDonationContract nonReentrant returns (uint256) {
        emit MintAttempt(msg.sender, donationContract, _donor);
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(_donor, tokenId);

        donationProofs[tokenId] = DonationProof(
            _amount,
            _association,
            block.timestamp,
            _blockNumber
        );
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

    /// @notice Burn a token
    function burn(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Only token owner can burn");
        require(_exists(_tokenId), "Token does not exist");
        _burn(_tokenId);
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
