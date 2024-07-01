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
    struct Association {
        string name;
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

    /// @notice Events to log donation, funds transfer, and association changes
    event FundsTransferred(
        address indexed recipient,
        uint256 amount,
        string purpose
    );

    event AssociationAdded(address indexed association, string name);
    event AssociationRemoved(address indexed association);
    /// Efficient filtering for donations by either donor address, association address, or both.
    event DonationReceived(
        address indexed donor,
        uint256 amount,
        address indexed association
    );

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
    function addAssociation(
        address _association,
        string memory _name
    ) external onlyOwner {
        require(_association != address(0), "Invalid address");
        require(
            !associations[_association].whitelisted,
            "Association already whitelisted"
        );
        require(bytes(_name).length > 0, "Association name cannot be empty");

        associations[_association] = Association({
            name: _name,
            balance: 0,
            addr: _association,
            whitelisted: true,
            lastDeposit: block.timestamp
        });

        associationId[_association] = associationList.length;
        associationList.push(_association);

        emit AssociationAdded(_association, _name);
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
        // 5% commission on all withdrawals
        uint256 _commission = (_amount * 5) / 100;
        // The amount after commission
        uint256 _amountAfterCommission = _amount - _commission;
        require(
            _amountAfterCommission + _commission <= address(this).balance,
            "Contract balance is insufficient for transfer and commission"
        );
        require(_recipient != address(0), "Invalid recipient address");
        // Ensure that the contract has enough balance to cover the commission
        require(
            _commission <= address(this).balance - _amountAfterCommission,
            "Insufficient balance for commission"
        );

        totalWithdrawals[msg.sender] += _amountAfterCommission;
        _recipient.transfer(_amountAfterCommission);
        msg.sender.transfer(_commission);

        emit FundsTransferred(_recipient, _amountAfterCommission, _purpose);
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
    /// @return The name and whitelisted status of the association
    function getAssociationDetails(
        address _association
    ) external view returns (string memory, bool) {
        Association memory assoc = associations[_association];
        return (assoc.name, assoc.whitelisted);
    }
}
