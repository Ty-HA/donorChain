// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";



contract Donation is Ownable {
    mapping(address => uint256) public totalDonations;
    event DonationReceived(address indexed donor, uint256 amount);

    constructor() Ownable(msg.sender) {
        // constructor
    }

    function donate() public payable {
        require(msg.value > 0, "Donation must be greater than zero");
        totalDonations[msg.sender] += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    // ::::::::::::: GETTERS ::::::::::::: //

    // Getter function to retrieve total donations of a specific donor
    function getTotalDonations(address donor) public view returns (uint256) {
        return totalDonations[donor];
    }

    // Getter function to retrieve the contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
