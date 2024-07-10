"use client";
import { useUserRole } from "@/hooks/userRole";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractDonationAddress, contractDonationAbi } from "@/constants";

interface Association {
  name: string;
  balance: string;
  lastDeposit: string;
  totalDonations: string;
}

interface DonationRecord {
  donor: string;
  amount: string;
  timestamp: string;
  blockNumber: string;
}

export default function AssociationDashboard() {
  const userRole = useUserRole();
  const [association, setAssociation] = useState<Association | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    async function getAddress() {
      if (typeof window.ethereum !== "undefined") {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setUserAddress(address);
        } catch (error) {
          console.error("Error getting user address:", error);
        }
      }
    }
    getAddress();
  }, []);

  useEffect(() => {
    if (userRole === "association" && userAddress) {
      fetchAssociationDetails(userAddress);
      fetchDonations(userAddress);
    }
  }, [userRole, userAddress]);

  async function fetchAssociationDetails(address: string) {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          contractDonationAddress,
          contractDonationAbi,
          provider
        );
        const details = await contract.associations(address);
        const balance = await contract.getAssociationBalance(address);
        const lastDeposit = await contract.getAssociationLastDeposit(address);
        const totalDonations = await contract.getTotalDonationsToAssociation(
          address
        );

        setAssociation({
          name: details.name,
          balance: ethers.formatEther(balance),
          lastDeposit: new Date(Number(lastDeposit) * 1000).toLocaleString(),
          totalDonations: ethers.formatEther(totalDonations),
        });
      } catch (error) {
        console.error("Error fetching association details:", error);
      }
    }
  }

  async function fetchDonations(address: string) {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          contractDonationAddress,
          contractDonationAbi,
          provider
        );
        const donationRecords = await contract.getDonationsByAssociation(
          address
        );

        const formattedDonations = donationRecords.map((record: any) => ({
          donor: record.donor,
          amount: ethers.formatEther(record.amount),
          timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
          blockNumber: record.blockNumber.toString(),
        }));

        setDonations(formattedDonations);
      } catch (error) {
        console.error("Error fetching donations:", error);
      }
    }
  }

  async function handleTransferFunds(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window.ethereum !== "undefined" && userAddress) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          contractDonationAddress,
          contractDonationAbi,
          signer
        );

        const tx = await contract.transferFunds(
          recipient,
          ethers.parseEther(amount),
          purpose
        );
        await tx.wait();

        alert("Funds transferred successfully!");
        fetchAssociationDetails(userAddress);
      } catch (error) {
        console.error("Error transferring funds:", error);
        alert("Error transferring funds. Please try again.");
      }
    }
  }

  if (userRole === "disconnected") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-black mb-4 font-bold text-xl">
          ASSOCIATION DASHBOARD
        </h2>
        <p className="text-black mb-4">Please connect your wallet</p>
      </div>
    );
  }

  if (userRole !== "association") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-red-600 mb-4 font-bold text-3xl">ACCESS DENIED</h2>
        <p className="text-red-600 mb-4 text-center">
          You are not authorized to access this page. Only associations can
          access this dashboard.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (!association) {
    return (
      <div className="min-h-screen flex items-center justify-center text-black">
        Loading association details...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-blue-800 mb-10 font-bold text-4xl text-center mt-8">
        Association Dashboard for {association.name}
      </h1>
      <div>
        <p className="text-black mb-2 text-xl">
          <strong>Balance:</strong> {association.balance} ETH
        </p>
        <p className="text-black mb-2 text-xl">
          <strong>Last Deposit:</strong> {association.lastDeposit}
        </p>
        <p className="text-black mb-4 text-xl">
          <strong>Total Donations Received:</strong>{" "}
          {association.totalDonations} ETH
        </p>

        <h2 className="text-black text-xl font-bold mb-2">Transfer Funds</h2>
        <form onSubmit={handleTransferFunds} className="mb-8">
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="block w-full p-2 mb-2 border rounded"
          />
          <input
            type="text"
            placeholder="Amount (ETH)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full p-2 mb-2 border rounded"
          />
          <input
            type="text"
            placeholder="Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="block w-full p-2 mb-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Transfer Funds
          </button>
        </form>
      </div>

      <h2 className="text-blue-800 mb-10 font-bold text-3xl text-center mt-8">
        Recent Donations
      </h2>
      <table className="w-full text-black border-collapse border-blue-500">
        <thead>
          <tr>
            <th className="text-left text-xl border p-2 border-blue-500">
              Donor
            </th>
            <th className="text-left text-xl border p-2 border-blue-500">
              Amount
            </th>
            <th className="text-left text-xl border p-2 border-blue-500">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {donations.map((donation, index) => (
            <tr
              key={index}
              className={`${
                index % 2 === 0 ? "bg-gray-200" : ""
              } border-blue-500`}
            >
              <td className="border p-2 border-blue-500">{donation.donor}</td>
              <td className="border p-2 border-blue-500">
                {donation.amount} ETH
              </td>
              <td className="border p-2 border-blue-500">
                {donation.timestamp}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
