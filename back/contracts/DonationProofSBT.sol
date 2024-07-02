// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DonationProofSBT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    struct DonationProof {
        uint256 amount;
        address association;
        uint256 timestamp;
    }

    address public donationContract;

    function setDonationContract(address _donationContract) external onlyOwner {
        donationContract = _donationContract;
    }

    modifier onlyDonationContract() {
        require(
            msg.sender == donationContract,
            "Caller is not the Donation contract"
        );
        _;
    }

    mapping(uint256 => DonationProof) public donationProofs;

    constructor() ERC721("DonationProof", "DPF") Ownable(msg.sender) {}

    function mint(
        address _donor,
        uint256 _amount,
        address _association
    ) external onlyDonationContract returns (uint256) { 
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(_donor, tokenId);
        donationProofs[tokenId] = DonationProof(
            _amount,
            _association,
            block.timestamp
        );
        return tokenId;
    }

    function transferFrom(address, address, uint256) public pure override {
        revert("SBTs are not transferable");
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert("SBTs are not transferable");
    }

    function getDonationProof(
        uint256 tokenId
    ) external view returns (DonationProof memory) {
        require(_exists(tokenId), "Token does not exist");
        return donationProofs[tokenId];
    }

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Only token owner can burn");
        _burn(tokenId);
        delete donationProofs[tokenId];
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}