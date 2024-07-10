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
    /// @notice A mapping of association indices
    mapping(address => uint256) private associationId;
    /// @notice A mapping of total donations made to each association
    mapping(address => uint256) public totalDonationsToAssociation;
    /// @notice A mapping of donations made to each association
    mapping(address => DonationRecord[]) public donationsByAssociation;
    /// @notice A mapping of transfers made by each association
    mapping(address => TransferRecord[]) private associationTransfers;

    /// @notice An array of whitelisted associations
    address[] public associationList;

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

    /// @dev Sets the original owner of the contract upon deployment
    /// @param _sbtContractAddress The address of the DonationProofSBT contract
    /// @param _badgeContractAddress The address of the DonationBadgeNFT contract
    constructor(
        address _sbtContractAddress,
        address _badgeContractAddress
    ) Ownable(msg.sender) {
        sbtContract = DonationProofSBT(_sbtContractAddress);
        badgeContract = DonationBadgeNFT(_badgeContractAddress);
    }

    /// @notice Sets the address of the DonationBadgeNFT contract to mint badges for donors as rewards for their donations
    /// @param _badgeContractAddress The address of the DonationBadgeNFT contract
    function setBadgeContract(
        address _badgeContractAddress
    ) external onlyOwner {
        require(
            _badgeContractAddress != address(0),
            "Invalid badge contract address"
        );
        badgeContract = DonationBadgeNFT(_badgeContractAddress);
        emit BadgeContractSet(_badgeContractAddress);
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
    /// @param _association The address of the association to add
    /// @param _name The name of the association
    /// @param _postalAddress The postal address of the association
    /// @param _rnaNumber The RNA number of the association
    function addAssociation(
        address _association,
        string memory _name,
        string memory _postalAddress,
        string memory _rnaNumber
    ) external onlyOwner {
        require(_association != address(0), "Invalid address");
        require(
            !associations[_association].whitelisted,
            "Association already whitelisted"
        );
        require(bytes(_name).length > 0, "Association name cannot be empty");
        require(
            bytes(_postalAddress).length > 0,
            "Postal address cannot be empty"
        );

        associations[_association] = Association({
            name: _name,
            postalAddress: _postalAddress,
            rnaNumber: _rnaNumber,
            balance: 0,
            addr: _association,
            whitelisted: true,
            lastDeposit: block.timestamp
        });

        associationId[_association] = associationList.length;
        associationList.push(_association);

        emit AssociationAdded(_association, _name, _postalAddress, _rnaNumber);
    }

    /// @notice Update association information if they want to change their wallet address
    /// @param _addr The current address of the association
    /// @param _newAddr The new address of the association

    function updateAssociationWalletAddr(
        address _addr,
        address _newAddr
    ) external onlyOwner {
        require(associations[_addr].whitelisted, "Association not whitelisted");
        require(_newAddr != address(0), "Invalid address");

        // Save the association data
        Association memory updatedAssociation = associations[_addr];
        // Update the address in the struct
        updatedAssociation.addr = _newAddr;

        // Remove the old entry
        delete associations[_addr];
        // Add the updated association with the new address as the key
        associations[_newAddr] = updatedAssociation;

        // Update associationList
        uint256 index = associationId[_addr];
        associationList[index] = _newAddr;

        // Update associationId
        delete associationId[_addr];
        associationId[_newAddr] = index;

        emit AssociationWalletAddrUpdated(_addr, _newAddr);
    }

    /// @notice Update association information if they want to change their postal address
    /// @param _addr The wallet address of the association
    /// @param _newPostalAddress The new postal address of the association
    function updateAssociationPostalAddr(
        address _addr,
        string memory _newPostalAddress
    ) external onlyOwner {
        require(associations[_addr].whitelisted, "Association not whitelisted");
        require(bytes(_newPostalAddress).length > 0, "Invalid postal address");

        // Update the association's postal address
        associations[_addr].postalAddress = _newPostalAddress;

        emit AssociationUpdated(_addr, _newPostalAddress);
    }

    /// @notice Update association information if they want to change their name
    /// @param _addr The wallet address of the association
    /// @param _newName The new name of the association
    function updateAssociationName(
        address _addr,
        string memory _newName
    ) external onlyOwner {
        require(associations[_addr].whitelisted, "Association not whitelisted");
        require(bytes(_newName).length > 0, "Invalid Name");

        // Update the association's postal address
        associations[_addr].name = _newName;

        emit AssociationNameUpdated(_addr, _newName);
    }

    function removeAssociation(address _association) external onlyOwner {
        require(
            associations[_association].whitelisted,
            "Association not whitelisted"
        );

        uint256 balance = associations[_association].balance;
        if (balance > 0) {
            // If the association has remaining funds, prevent removal
            revert(
                "Association has remaining funds. Please withdraw before removing."
            );
        }

        uint256 index = associationId[_association];
        uint256 lastIndex = associationList.length - 1;
        address lastAssociation = associationList[lastIndex];

        associationList[index] = lastAssociation;
        associationId[lastAssociation] = index;

        associationList.pop();
        delete associationId[_association];

        // Reset association details
        associations[_association].whitelisted = false;
        // Reset association balance
        associations[_association].balance = 0;

        emit AssociationRemoved(_association);
        delete associations[_association];
    }

    // ::::::::::::: DONATION MANAGEMENT ::::::::::::: //

    /// @notice Allows donors to donate to the contract
    /// @param _association The address of the association to donate to
    /// @param _amount The amount they want to donate

    function donateToAssociation(
        address _association,
        uint256 _amount
    ) external payable nonReentrant whenNotPaused {
        require(_amount > 0, "Donation amount must be greater than zero");
        require(
            msg.value == _amount,
            "Sent amount does not match specified amount"
        );
        require(
            associations[_association].whitelisted,
            "Association is not whitelisted"
        );
        require(
            msg.sender != _association,
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
        donationsByAssociation[_association].push(newDonation);

        // Update the association's balance
        associations[_association].balance += _amount;
        associations[_association].lastDeposit = block.timestamp;

        totalDonationsFromDonor[msg.sender] += _amount;
        totalDonationsToAssociation[_association] += _amount;

        // Mint SBT as proof of donation
        uint256 tokenId = DonationProofSBT(sbtContract).mint(
            msg.sender,
            _amount,
            _association,
            block.number
        );

        // Check if the donor deserves a new badge
        if (address(badgeContract) != address(0)) {
            uint256 totalDonated = totalDonationsFromDonor[msg.sender];
            try badgeContract.mintBadge(msg.sender, totalDonated) {
                // Badge minted successfully
            } catch {
                // Badge minting failed, but we don't want to revert the donation
                // You might want to emit an event here to log the failure
            }
        }

        emit DonationReceived(
            msg.sender,
            _amount,
            _association,
            tokenId,
            block.timestamp,
            block.number
        );
    }

    /// @notice Allows whitelisted associations to transfer their ether to a specific recipient for a specified purpose
    /// This function is protected against reentrancy attacks by using the `nonReentrant` modifier.
    /// The nonReentrant modifier prevents such reentrancy attacks by ensuring that no external calls can be made to the contract while it is still executing.
    /// @param _recipient The address to transfer the ether to
    /// @param _amount The amount of ether to transfer
    /// @param _purpose The purpose of the transfer
    function transferFunds(
        address payable _recipient,
        uint256 _amount,
        string calldata _purpose
    ) external onlyAssociation nonReentrant whenNotPaused {
        // 5% commission on each transfer
        uint256 _commission = (_amount * 5) / 100;

        uint256 _amountAfterCommission = _amount - _commission;

        require(
            _amountAfterCommission + _commission <= address(this).balance,
            "Insufficient contract balance for transfer"
        );
        require(_recipient != address(0), "Invalid recipient address");

        totalWithdrawals[msg.sender] += _amountAfterCommission;
        associations[msg.sender].balance -= _amount;
        _recipient.transfer(_amountAfterCommission);

        accumulatedCommissions += _commission;
        emit CommissionAccumulated(_commission);

        emit FundsTransferred(
            _recipient,
            _amountAfterCommission,
            _purpose,
            block.timestamp,
            block.number
        );

        associationTransfers[msg.sender].push(
            TransferRecord(_recipient, _amount, _purpose, block.timestamp)
        );
    }

    /// @notice Owner can withdraw accumulated commissions
    function withdrawCommissions() external onlyOwner {
        uint256 amount = accumulatedCommissions;
        require(amount > 0, "No commissions to withdraw");
        accumulatedCommissions = 0;
        payable(owner()).transfer(amount);

        emit CommissionsWithdrawn(amount);
    }

    // ::::::::::::: SBT ::::::::::::: //

    /// @notice Sets the address of the DonationProofSBT contract
    /// @param _sbtContractAddress The address of the DonationProofSBT contract
    function setSBTContract(address _sbtContractAddress) external onlyOwner {
        require(
            _sbtContractAddress != address(0),
            "Invalid SBT contract address"
        );
        sbtContract = DonationProofSBT(_sbtContractAddress);
        emit SBTContractSet(_sbtContractAddress);
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
    /// @param _donor The address of the donor
    /// @return The total amount donated by the specified address
    function getTotalDonationsFromOneDonor(
        address _donor
    ) external view returns (uint256) {
        return totalDonationsFromDonor[_donor];
    }

    /// @notice Retrieves the total withdrawals made by a specific address
    /// @return The total amount withdrawn by the specified address
    function getTotalWithdrawals(
        address _association
    ) external view returns (uint256) {
        return totalWithdrawals[_association];
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
    /// @param _association The address of the association
    /// @return The balance of the specified association
    function getAssociationBalance(
        address _association
    ) public view returns (uint256) {
        return associations[_association].balance;
    }

    /// @notice Retrieves the last deposit timestamp of a specific association
    /// @param _association The address of the association
    /// @return The timestamp of the last deposit made to the specified association
    function getAssociationLastDeposit(
        address _association
    ) public view returns (uint256) {
        return associations[_association].lastDeposit;
    }

    /// @notice Retrieves the total donations received by a specific association
    /// @param _association The address of the association
    /// @return The total amount donated to the specified association
    function getTotalDonationsToAssociation(
        address _association
    ) external view returns (uint256) {
        return totalDonationsToAssociation[_association];
    }

    /// @notice Retrieves the list of donations made to a specific association
    /// @param _association The address of the association*
    /// @return An array of donations made to the specified association
    function getDonationsByAssociation(
        address _association
    ) external view returns (DonationRecord[] memory) {
        return donationsByAssociation[_association];
    }

    /// @notice Get the list of transfers made by a specific association
    /// @param _association The address of the association
    /// @return An array of transfers made by the specified association
    function getTransfersByAssociation(
        address _association
    ) external view returns (TransferRecord[] memory) {
        return associationTransfers[_association];
    }

    /// @notice Retrieves the list of whitelisted associations
    /// @return An array of addresses of whitelisted associations
    function getWhitelistedAssociations()
        external
        view
        returns (address[] memory)
    {
        return associationList;
    }

    /// @notice Retrieves the details of a specific association
    /// @param _association The address of the association
    /// @return The details of the association including name, postal address, RNA number, and whitelisted status
    function getAssociationDetails(
        address _association
    )
        external
        view
        returns (string memory, string memory, string memory, bool)
    {
        Association memory assoc = associations[_association];
        return (
            assoc.name,
            assoc.postalAddress,
            assoc.rnaNumber,
            assoc.whitelisted
        );
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
