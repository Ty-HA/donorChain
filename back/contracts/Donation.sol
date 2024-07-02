// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// OpenZeppelin library for access control
import "@openzeppelin/contracts/access/Ownable.sol";

// Security library to prevent reentrancy attacks
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// considering adding a Pausable library in case of emergency ?

/// @title Donation contract
/// @author Ty Ha
/// @notice You can use this contract for donating ether to the contract
contract Donation is Ownable, ReentrancyGuard {
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

    /// @notice An array of whitelisted associations
    address[] public associationList;

   

    event AssociationAdded(address indexed association, string name, string postalAddress, string rnaNumber);
    event AssociationRemoved(address indexed association);
    event AssociationAddrUpdated(address indexed association, string postalAddress);
    event AssociationWalletAddrUpdated(address indexed association, address newAddr);
    /// Efficient filtering for donations by either donor address, association address, or both.
    event DonationReceived(
        address indexed donor,
        uint256 amount,
        address indexed association
    );
     /// @notice Events to log donation, funds transfer, and association changes
    event FundsTransferred(
        address indexed recipient,
        uint256 amountAfetrCommission,
        string purpose
    );
    event CommissionsWithdrawn(uint256 amount);

    /// @dev Sets the original owner of the contract upon deployment
    constructor() Ownable(msg.sender) {}

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
        address  _association,
        string memory _name,
        string memory _postalAddress,
        string memory _rnaNumber
    ) external onlyOwner {
        require( _association != address(0), "Invalid address");
        require(
            !associations[ _association].whitelisted,
            "Association already whitelisted"
        );
        require(bytes(_name).length > 0, "Association name cannot be empty");
        require(
            bytes(_postalAddress).length > 0,
            "Postal address cannot be empty"
        );

        associations[ _association] = Association({
            name: _name,
            postalAddress: _postalAddress,
            rnaNumber: _rnaNumber,
            balance: 0,
            addr:  _association,
            whitelisted: true,
            lastDeposit: block.timestamp
        });

        associationId[ _association] = associationList.length;
        associationList.push(_association);

        emit AssociationAdded(_association, _name, _postalAddress, _rnaNumber);
    }

    /// @notice Update association information if they want to change their wallet address
    /// @param _addr The current address of the association
    /// @param _newAddr The new address of the association

    function updateAssociationWalletAddr(
        address _addr,
        address _newAddr,

    ) external onlyOwner {
        require(associations[_addr].whitelisted, "Association not whitelisted");
        require(_newAddr != address(0), "Invalid address");

        // Update the association's address and name
        associations[_addr].addr = _newAddr;

        // Optionally, if you want to update the mapping key to the new address
        // First, save the association data
        Association memory updatedAssociation = associations[_addr];
        // Update the address in the struct
        updatedAssociation.addr = _newAddr;
        // Remove the old entry
        delete associations[_addr];
        // Add the updated association with the new address as the key
        associations[_newAddr] = updatedAssociation;

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

    /// @notice Removes an association from the whitelist
    /// @param _association The address of the association to remove
    function removeAssociation(address _association) external onlyOwner {
        require(
            associations[_association].whitelisted,
            "Association not whitelisted"
        );

        uint256 index = associationId[_association];
        uint256 lastIndex = associationList.length - 1;
        address lastAssociation = associationList[lastIndex];

        associationList[index] = lastAssociation;
        associationId[lastAssociation] = index;

        associationList.pop();
        delete associationId[_association];

        // Reset association details
        associations[_association].whitelisted = false;

        emit AssociationRemoved(_association);
    }

    // ::::::::::::: DONATION MANAGEMENT ::::::::::::: //

    /// @notice Allows donors to donate ether to the contract
    /// @param _association The address of the association to donate to
    /// @param _amount The amount of ether to donate
    function donateToAssociation(
        address _association,
        uint256 _amount
    ) public payable {
        require(_amount > 0, "Donation amount must be greater than zero");
        require(
            msg.value == _amount,
            "Sent ether amount does not match specified amount"
        );
        require(
            associations[_association].whitelisted,
            "Association is not whitelisted"
        );
        require(
            msg.sender != _association,
            "Association cannot donate to itself"
        );

        // Update association balance
        DonationRecord memory newDonation = DonationRecord({
            donor: msg.sender,
            amount: _amount,
            timestamp: block.timestamp
        });
        donationsByAssociation[_association].push(newDonation);

        // Update the association's balance
        associations[_association].balance += _amount;
        associations[_association].lastDeposit = block.timestamp;

        totalDonationsFromDonor[msg.sender] += _amount;
        totalDonationsToAssociation[_association] += _amount;
        emit DonationReceived(msg.sender, _amount, _association);
    }

    /// @notice Allows whitelisted associations to transfer ether to a specific recipient for a specified purpose
    /// This function is protected against reentrancy attacks by using the `nonReentrant` modifier.
    /// The nonReentrant modifier prevents such reentrancy attacks by ensuring that no external calls can be made to the contract while it is still executing.
    /// @param _recipient The address to transfer the ether to
    /// @param _amount The amount of ether to transfer
    /// @param _purpose The purpose of the transfer
     function transferFunds(
        address payable _recipient,
        uint256 _amount,
        string calldata _purpose
    ) external onlyAssociation nonReentrant {
        // 5% commission on each transfer
        uint256 _commission = (_amount * 5) / 100;

        uint256 _amountAfterCommission = _amount - _commission;

        require(
            _amountAfterCommission + _commission <= address(this).balance,
            "Le solde du contrat est insuffisant pour le transfert et la commission"
        );
        require(_recipient != address(0), "Adresse du destinataire invalide");

        totalWithdrawals[msg.sender] += _amountAfterCommission;
        _recipient.transfer(_amountAfterCommission);

        // Accumulation de la commission au lieu de la transférer immédiatement
        accumulatedCommissions += _commission;

        emit FundsTransferred(_recipient, _amountAfterCommission, _purpose);
    }

    /// @notice Owner can withdraw accumulated commissions
    function withdrawCommissions() external onlyOwner {
        uint256 amount = accumulatedCommissions;
        require(amount > 0, "Aucune commission à retirer");

        accumulatedCommissions = 0;
        payable(owner()).transfer(amount);

        emit CommissionsWithdrawn(amount);
    }

    // Assurez-vous de définir cet événement quelque part dans votre contrat
    event CommissionsWithdrawn(uint256 amount);
}

    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Retrieves the total donations made by a specific donor
    /// @param _donor The address of the donor
    /// @return The total amount donated by the specified address
    function getTotalDonationsFromOneDonor(
        address _donor
    ) external view returns (uint256) {
        return totalDonationsFromDonor[_donor];
    }

    /// @notice Retrieves the total withdrawals made by a specific address
    /// @param _recipient The address of the recipient
    /// @return The total amount withdrawn by the specified address
    function getTotalWithdrawals(
        address _association
    ) external view returns (uint256) {
        return totalWithdrawals[_association];
    }

    /// @notice Retrieves the current balance of the contract
    /// @return The total balance of the contract
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
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
    ) external view returns (string memory, string memory, string memory, bool) {
        Association memory assoc = associations[_association];
        return (assoc.name, assoc.postalAddress, assoc.rnaNumber, assoc.whitelisted);
    }
}
