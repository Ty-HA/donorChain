// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// OpenZeppelin library for access control
import "@openzeppelin/contracts/access/Ownable.sol";

// Security library to prevent reentrancy attacks and pause the contract
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Importing the DonationProofSBT contract to mint NFTs for donations
import {DonationProofSBT} from "./DonationProofSBT.sol";
import {DonationBadgeNFT} from "./DonationBadgeNFT.sol";

/*
 ____   ___  _   _  ___  ____   ____ _   _    _    ___ _   _ 
|  _ \ / _ \| \ | |/ _ \|  _ \ / ___| | | |  / \  |_ _| \ | |
| | | | | | |  \| | | | | |_) | |   | |_| | / _ \  | ||  \| |
| |_| | |_| | |\  | |_| |  _ <| |___|  _  |/ ___ \ | || |\  |
|____/ \___/|_| \_|\___/|_| \_\\____|_| |_/_/   \_\___|_| \_|
                                                              
*/

/// @title Donation contract
/// @author Ty Ha
/// @notice You can use this contract for donating to the contract
contract Donation is Ownable, ReentrancyGuard, Pausable {
    DonationProofSBT public sbtContract;
    DonationBadgeNFT public badgeContract;

    /// @notice A struct to represent an association
    /// @param name The name of the association
    /// @param postalAddress The postal address of the association
    /// @param rnaNumber The RNA number of the association, french associations are required to have one
    /// @param balance The balance of the association
    /// @param addr The address of the association
    /// @param whitelisted The whitelisted status of the association
    /// @param lastDeposit The timestamp of the last deposit made to the association
    struct Association {
        string name;
        string postalAddress;
        string rnaNumber;
        uint256 balance;
        address addr;
        bool whitelisted;
        uint256 lastDeposit;
    }

    /// @notice A struct to represent a donation record
    struct DonationRecord {
        address donor;
        uint256 amount;
        uint256 timestamp;
        uint256 blockNumber;
    }

    struct TransferRecord {
        address recipient;
        uint256 amount;
        string purpose;
        uint256 timestamp;
    }

    /// @notice The total amount of amount donated to the contract
    uint256 private accumulatedCommissions;

    /// @notice A mapping of total donations made by each address
    mapping(address => uint256) public totalDonationsFromDonor;
    /// @notice A mapping of total withdrawals made by each address
    mapping(address => uint256) public totalWithdrawals;
    /// @notice A mapping of whitelisted associations
    mapping(address => Association) public associations;
    /// @notice A mapping of total donations made to each association
    mapping(address => uint256) public totalDonationsToAssociation;
    /// @notice A mapping of donations made to each association
    mapping(address => DonationRecord[]) public donationsByAssociation;
    /// @notice A mapping of transfers made by each association
    mapping(address => TransferRecord[]) private associationTransfers;
    /// @notice A mapping of whitelisted addresses
    mapping(address => bool) public isWhitelisted;

    mapping(uint256 => address) private whitelistedAddresses;
    mapping(address => uint256) private whitelistedIndices;
    uint256 public whitelistedCount;

    event BadgeContractSet(address indexed badgeContract);
    event AssociationAdded(
        address indexed association,
        string name,
        string postalAddress,
        string rnaNumber
    );
    event AssociationRemoved(address indexed association);
    event AssociationAddrUpdated(
        address indexed association,
        string postalAddress
    );
    event AssociationWalletAddrUpdated(
        address indexed association,
        address newAddr
    );

    event AssociationUpdated(address indexed association, string postalAddress);
    event AssociationNameUpdated(address indexed association, string name);

    event DonationReceived(
        address indexed donor,
        uint256 amount,
        address indexed association,
        uint256 tokenId,
        uint256 timestamp,
        uint256 blockNumber
    );

    /// @notice Events to log donation, funds transfer, and association changes
    event FundsTransferred(
        address indexed recipient,
        uint256 amountAfetrCommission,
        string purpose,
        uint256 timestamp,
        uint256 blockNumber
    );
    event CommissionAccumulated(uint256 amount);
    event CommissionsWithdrawn(uint256 amount);
    event SBTContractSet(address indexed sbtContract);
    event MaxWhitelistedUpdated(uint256 oldMax, uint256 newMax);

    /// @dev Sets the original owner of the contract upon deployment
    /// @param sbtContractAddress The address of the DonationProofSBT contract
    /// @param badgeContractAddress The address of the DonationBadgeNFT contract
    constructor(
        address sbtContractAddress,
        address badgeContractAddress
    ) Ownable(msg.sender) {
        sbtContract = DonationProofSBT(sbtContractAddress);
        badgeContract = DonationBadgeNFT(badgeContractAddress);
    }

    /// @notice Sets the address of the DonationBadgeNFT contract to mint badges for donors as rewards for their donations
    /// @param badgeContractAddress The address of the DonationBadgeNFT contract
    function setBadgeContract(
        address badgeContractAddress
    ) external onlyOwner {
        require(
            badgeContractAddress != address(0),
            "Invalid badge contract address"
        );
        badgeContract = DonationBadgeNFT(badgeContractAddress);
        emit BadgeContractSet(badgeContractAddress);
    }

    uint256 public maxWhitelisted = 100;

    /// @notice Sets the maximum number of whitelisted associations
    /// @param newMax The new maximum number of whitelisted associations
    function setMaxWhitelisted(uint256 newMax) external onlyOwner {
        require(
            newMax > maxWhitelisted,
            "New max must be greater than current max"
        );
        uint oldMax = maxWhitelisted;
        maxWhitelisted = newMax;
        emit MaxWhitelistedUpdated(oldMax, newMax);
    }

    // ::::::::::::: MODIFIERS ::::::::::::: //

    modifier onlyAssociation() {
        require(
            associations[msg.sender].whitelisted,
            "You're not an association on our whitelist"
        );
        _;
    }

    // ::::::::::::: ASSOCIATIONS MANAGEMENT ::::::::::::: //

    /// @notice Adds an association to the whitelist
    /// @param association The address of the association to add
    /// @param name The name of the association
    /// @param postalAddress The postal address of the association
    /// @param rnaNumber The RNA number of the association
    function addAssociation(
        address association,
        string memory name,
        string memory postalAddress,
        string memory rnaNumber
    ) external onlyOwner {
        require(association != address(0), "Invalid address");
        require(
            !isWhitelisted[association],
            "Association already whitelisted"
        );
        require(bytes(name).length > 0, "Association name cannot be empty");
        require(
            bytes(postalAddress).length > 0,
            "Postal address cannot be empty"
        );
        require(
            whitelistedCount < maxWhitelisted,
            "Maximum whitelisted associations reached"
        );

        associations[association] = Association({
            name: name,
            postalAddress: postalAddress,
            rnaNumber: rnaNumber,
            balance: 0,
            addr: association,
            whitelisted: true,
            lastDeposit: block.timestamp
        });

        isWhitelisted[association] = true;
        whitelistedAddresses[whitelistedCount] = association;
        whitelistedIndices[association] = whitelistedCount;
        whitelistedCount++;

        emit AssociationAdded(association, name, postalAddress, rnaNumber);
    }

    /// @notice Update association information if they want to change their wallet address
    /// @param addr The current address of the association
    /// @param newAddr The new address of the association

    function updateAssociationWalletAddr(
        address addr,
        address newAddr
    ) external onlyOwner {
        require(isWhitelisted[addr], "Association not whitelisted");
        require(!isWhitelisted[newAddr], "New address already whitelisted");
        require(newAddr != address(0), "Invalid address");

        // Save the association data
        Association memory updatedAssociation = associations[addr];
        // Update the address in the struct
        updatedAssociation.addr = newAddr;

        // Update the mappings
        uint256 index = whitelistedIndices[addr];
        whitelistedAddresses[index] = newAddr;
        whitelistedIndices[newAddr] = index;
        // Remove the old entry
        delete associations[addr];
        // Add the updated association with the new address as the key
        associations[newAddr] = updatedAssociation;

        // Update associationList
        // Update whitelist status
        isWhitelisted[addr] = false;
        isWhitelisted[newAddr] = true;

        emit AssociationWalletAddrUpdated(addr, newAddr);
    }

    /// @notice Update association information if they want to change their postal address
    /// @param addr The wallet address of the association
    /// @param newPostalAddress The new postal address of the association
    function updateAssociationPostalAddr(
        address addr,
        string memory newPostalAddress
    ) external onlyOwner {
        require(isWhitelisted[addr], "Association not whitelisted");
        require(bytes(newPostalAddress).length > 0, "Invalid postal address");

        // Update the association's postal address
        associations[addr].postalAddress = newPostalAddress;

        emit AssociationUpdated(addr, newPostalAddress);
    }

    /// @notice Update association information if they want to change their name
    /// @param addr The wallet address of the association
    /// @param newName The new name of the association
    function updateAssociationName(
        address addr,
        string memory newName
    ) external onlyOwner {
        require(isWhitelisted[addr], "Association not whitelisted");
        require(bytes(newName).length > 0, "Invalid Name");

        // Update the association's name
        associations[addr].name = newName;

        emit AssociationNameUpdated(addr, newName);
    }

    /// @notice Removes an association from the whitelist
    /// @param association The address of the association to remove
    function removeAssociation(address association) external onlyOwner {
        require(isWhitelisted[association], "Association not whitelisted");
        require(
            associations[association].balance == 0,
            "Association has remaining funds. Please withdraw before removing"
        );

        uint256 indexToRemove = whitelistedIndices[association];
        address lastAddress = whitelistedAddresses[whitelistedCount - 1];

        whitelistedAddresses[indexToRemove] = lastAddress;
        whitelistedIndices[lastAddress] = indexToRemove;

        delete whitelistedAddresses[whitelistedCount - 1];
        delete whitelistedIndices[association];

        isWhitelisted[association] = false;
        whitelistedCount--;

        delete associations[association];

        emit AssociationRemoved(association);
    }

    // ::::::::::::: DONATION MANAGEMENT ::::::::::::: //

    /// @notice Allows donors to donate to the contract
    /// @param association The address of the association to donate to
    /// @param amount The amount they want to donate
    function donateToAssociation(
        address association,
        uint256 amount
    ) public payable nonReentrant whenNotPaused {
        require(amount > 0, "Donation amount must be greater than zero");
        require(
            msg.value == amount,
            "Sent amount does not match specified amount"
        );
        require(
            associations[association].whitelisted,
            "Association is not whitelisted"
        );
        require(
            msg.sender != association,
            "Association cannot donate to itself"
        );
        require(address(sbtContract) != address(0), "SBT contract not set");

        // Update association balance
        DonationRecord memory newDonation = DonationRecord({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        donationsByAssociation[association].push(newDonation);

        // Update the association's balance
        associations[association].balance += amount;
        associations[association].lastDeposit = block.timestamp;

        totalDonationsFromDonor[msg.sender] += amount;
        totalDonationsToAssociation[association] += amount;

        // Mint SBT as proof of donation
        uint256 tokenId = DonationProofSBT(sbtContract).mint(
            msg.sender,
            amount,
            association,
            block.number
        );

        // Check if the donor deserves a new badge
        if (address(badgeContract) != address(0)) {
            uint256 totalDonated = totalDonationsFromDonor[msg.sender];
            try badgeContract.mintBadge(msg.sender, totalDonated) {
                // Badge minted successfully
            } catch {
                // Badge minting failed, don't want to revert the donation
                // add event to log the failure
            }
        }

        emit DonationReceived(
            msg.sender,
            amount,
            association,
            tokenId,
            block.timestamp,
            block.number
        );
    }

    /// @notice Allows whitelisted associations to transfer their ether to a specific recipient for a specified purpose
    /// This function is protected against reentrancy attacks by using the `nonReentrant` modifier.
    /// The nonReentrant modifier prevents such reentrancy attacks by ensuring that no external calls can be made to the contract while it is still executing.
    /// @param recipient The address to transfer the ether to
    /// @param amount The amount of ether to transfer
    /// @param purpose The purpose of the transfer
    function transferFunds(
        address payable recipient,
        uint256 amount,
        string calldata purpose
    ) external onlyAssociation nonReentrant whenNotPaused {
        // 5% commission on each transfer
        uint256 commission = (amount * 5) / 100;
        uint256 amountAfterCommission = amount - commission;
        require(recipient != msg.sender, "Cannot transfer to own address");
        require(
            amountAfterCommission + commission <= address(this).balance,
            "Insufficient contract balance for transfer"
        );
        require(recipient != address(0), "Invalid recipient address");

        totalWithdrawals[msg.sender] += amountAfterCommission;
        associations[msg.sender].balance -= amount;
        accumulatedCommissions += commission;

        associationTransfers[msg.sender].push(
            TransferRecord({
                recipient: recipient,
                amount: amount,
                purpose: purpose,
                timestamp: block.timestamp
            })
        );

        emit CommissionAccumulated(commission);
        emit FundsTransferred(
            recipient,
            amountAfterCommission,
            purpose,
            block.timestamp,
            block.number
        );
        recipient.transfer(amountAfterCommission);
    }

    /// @notice Owner can withdraw accumulated commissions
    function withdrawCommissions() external onlyOwner nonReentrant {
        uint256 amount = accumulatedCommissions;
        require(amount > 0, "No commissions to withdraw");
        accumulatedCommissions = 0;

        emit CommissionsWithdrawn(amount);

        payable(owner()).transfer(amount);
    }

    // ::::::::::::: SBT ::::::::::::: //

    /// @notice Sets the address of the DonationProofSBT contract
    /// @param sbtContractAddress The address of the DonationProofSBT contract
    function setSBTContract(address sbtContractAddress) external onlyOwner {
        require(
            sbtContractAddress != address(0),
            "Invalid SBT contract address"
        );
        sbtContract = DonationProofSBT(sbtContractAddress);
        emit SBTContractSet(sbtContractAddress);
    }

    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Retrieves the donation proof for a specific token ID
    /// @param tokenId The ID of the token
    /// @return donor The address of the donor
    /// @return amount The amount donated
    /// @return association The address of the association
    /// @return timestamp The timestamp of the donation
    /// @return blockNumber The block number of the donation
    function getDonationProofDetails(
        uint256 tokenId
    )
        external
        view
        returns (
            address donor,
            uint256 amount,
            address association,
            uint256 timestamp,
            uint256 blockNumber
        )
    {
        require(address(sbtContract) != address(0), "SBT contract not set");
        DonationProofSBT.DonationProof memory proof = sbtContract
            .getDonationProof(tokenId);
        donor = sbtContract.ownerOf(tokenId); // Assuming the SBT contract has an ownerOf function
        amount = proof.amount;
        association = proof.association;
        timestamp = proof.timestamp;
        blockNumber = proof.blockNumber;
    }

    /// @notice Retrieves the total donations made by a specific donor
    /// @param donor The address of the donor
    /// @return The total amount donated by the specified address
    function getTotalDonationsFromOneDonor(
        address donor
    ) external view returns (uint256) {
        return totalDonationsFromDonor[donor];
    }

    /// @notice Retrieves the total withdrawals made by a specific address
    /// @return The total amount withdrawn by the specified address
    function getTotalWithdrawals(
        address association
    ) external view returns (uint256) {
        return totalWithdrawals[association];
    }

    /// @notice Retrieves the accumulated commissions
    /// @return The total amount of accumulated commissions
    function getAccumulatedCommissions() public view returns (uint256) {
        return accumulatedCommissions;
    }

    /// @notice Retrieves the current balance of the contract
    /// @return The total balance of the contract
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Retrieves the balance of a specific association
    /// @param association The address of the association
    /// @return The balance of the specified association
    function getAssociationBalance(
        address association
    ) public view returns (uint256) {
        return associations[association].balance;
    }

    /// @notice Retrieves the last deposit timestamp of a specific association
    /// @param association The address of the association
    /// @return The timestamp of the last deposit made to the specified association
    function getAssociationLastDeposit(
        address association
    ) public view returns (uint256) {
        return associations[association].lastDeposit;
    }

    /// @notice Retrieves the total donations received by a specific association
    /// @param association The address of the association
    /// @return The total amount donated to the specified association
    function getTotalDonationsToAssociation(
        address association
    ) external view returns (uint256) {
        return totalDonationsToAssociation[association];
    }

    /// @notice Retrieves the list of donations made to a specific association
    /// @param association The address of the association*
    /// @return An array of donations made to the specified association
    function getDonationsByAssociation(
        address association
    ) external view returns (DonationRecord[] memory) {
        return donationsByAssociation[association];
    }

    /// @notice Retrieves the list of whitelisted associations
    /// @return An array of whitelisted associations
    function getWhitelistedAssociations(
        uint256 startIndex,
        uint256 count
    ) external view returns (address[] memory, uint256) {
        require(
            startIndex == 0 || startIndex < whitelistedCount,
            "Start index out of bounds"
        );

        if (whitelistedCount == 0) {
            return (new address[](0), 0);
        }

        uint256 endIndex = startIndex + count;
        if (endIndex > whitelistedCount) {
            endIndex = whitelistedCount;
        }
        uint256 resultCount = endIndex - startIndex;

        address[] memory result = new address[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = whitelistedAddresses[startIndex + i];
        }

        return (result, whitelistedCount);
    }

    /// @notice Retrieves the details of a specific association
    /// @param association The address of the association
    /// @return The details of the association including name, postal address, RNA number, and whitelisted status
    function getAssociationDetails(
        address association
    )
        external
        view
        returns (string memory, string memory, string memory, bool)
    {
        Association memory assoc = associations[association];
        return (
            assoc.name,
            assoc.postalAddress,
            assoc.rnaNumber,
            assoc.whitelisted
        );
    }

    /// @notice Get the list of transfers made by a specific association
    /// @param association The address of the association
    /// @return An array of transfers made by the specified association
    function getTransfersByAssociation(
        address association
    ) external view returns (TransferRecord[] memory) {
        return associationTransfers[association];
    }

    // ::::::::::::: PAUSABLE  ::::::::::::: //

    /// @notice Pauses the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the contract
    function unpause() external onlyOwner {
        _unpause();
    }
}
