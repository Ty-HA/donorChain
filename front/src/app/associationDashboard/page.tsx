"use client";
import { useUserRole } from "@/hooks/userRole";
import { useState, useEffect, useCallback } from "react";
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

interface TransferRecord {
  recipient: string;
  amount: string;
  purpose: string;
  timestamp: string;
}

export default function AssociationDashboard() {
  const userRole = useUserRole();
  const [association, setAssociation] = useState<Association | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);

  const getAddress = useCallback(async () => {
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
  }, []);

  const fetchAssociationDetails = useCallback(async (address: string) => {
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
  }, []);

  const fetchDonations = useCallback(async (address: string) => {
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
  }, []);

  const fetchTransferFunds = useCallback(async () => {
    if (typeof window.ethereum !== "undefined" && userAddress) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          contractDonationAddress,
          contractDonationAbi,
          provider
        );

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 5000000);

        const filter = contract.filters.FundsTransferred(
          null,
          null,
          null,
          null
        );
        const events = await contract.queryFilter(filter, fromBlock, "latest");

        const formattedTransfers = events
          .filter((event): event is ethers.EventLog => "args" in event)
          .map((event) => ({
            recipient: event.args[0],
            amount: ethers.formatEther(event.args[1]),
            purpose: event.args[2],
            timestamp: new Date(Number(event.args[3]) * 1000).toLocaleString(),
          }));
        console.log("Fetching transfers for address:", userAddress);
        console.log("Events found:", events.length);
        console.log("Formatted transfers:", formattedTransfers);

        setTransfers(formattedTransfers);
      } catch (error) {
        console.error("Error fetching transfer funds:", error);
      }
    }
  }, [userAddress]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setEvidenceFile(event.target.files[0]);
    }
  }, []);

  const handleUploadEvidence = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceFile) {
      alert("Please select a file to upload.");
      return;
    }
    console.log("Uploading file:", evidenceFile.name);
    alert("File uploaded successfully!");
  }, [evidenceFile]);

  const handleTransferFunds = useCallback(async (e: React.FormEvent) => {
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
        fetchTransferFunds();
      } catch (error) {
        console.error("Error transferring funds:", error);
        alert("Error transferring funds. Please try again.");
      }
    }
  }, [userAddress, recipient, amount, purpose, fetchAssociationDetails, fetchTransferFunds]);

  useEffect(() => {
    getAddress();
  }, [getAddress]);

  useEffect(() => {
    if (userRole === "association" && userAddress) {
      fetchAssociationDetails(userAddress);
      fetchDonations(userAddress);
      fetchTransferFunds();
    }
  }, [userRole, userAddress, fetchAssociationDetails, fetchDonations, fetchTransferFunds]);

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
        <p className="text-black mb-4 text-xl">
          <strong>Actual Balance: </strong><span className="bg-lime-300">{association.balance} ETH</span>
        </p>
        <p className="text-black mb-2 text-xl">
          <strong>Last Donation received:</strong> {association.lastDeposit}
        </p>
        <p className="text-black mb-4 text-xl">
          <strong>Total Donations Received:</strong>{" "}
          {association.totalDonations} ETH
        </p>

        <h2 className="text-blue-800 mb-10 font-bold text-3xl text-center mt-8">
          Upload Evidence
        </h2>
        <form onSubmit={handleUploadEvidence} className="mb-8 text-black">
          <input
            name="evidenceFile"
            type="file"
            onChange={handleFileChange}
            className="block w-full p-2 mb-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Upload Evidence
          </button>
        </form>

        <h2 className="text-black text-xl font-bold mb-2">Transfer Funds</h2>
        <form onSubmit={handleTransferFunds} className="mb-8 text-black">
          <input
            name="recipient"
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
            className="block w-full p-2 mb-2 border rounded text-black"
          />
          <input
            type="text"
            placeholder="Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="block w-full p-2 mb-2 border rounded text-black"
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
        Invoice Proof
      </h2>
      <p className="text-black">
        The association needs to provide evidence that the artisan completed
        this estimate.
      </p>
      <p className="text-black">
        Once the estimate is completed by the artisan, the association can
        upload a photo of the invoice as proof.
      </p>
      <p className="text-black">
        After uploading the invoice, the association will be able to transfer
        funds, and DonorChain will generate a PDF on IPFS as proof of the
        transaction.
      </p>
      <p className="text-black">
        This procedure will enhance transparency on the blockchain for donors.
      </p>

      <h2 className="text-blue-800 mb-10 font-bold text-3xl text-center mt-8">
        Recent Transfers
      </h2>
      <table className="w-full text-black border-collapse border-blue-500">
        <thead>
          <tr>
            <th className="text-left text-xl border p-2 border-blue-500">
              Recipient
            </th>
            <th className="text-left text-xl border p-2 border-blue-500">
              Amount
            </th>
            <th className="text-left text-xl border p-2 border-blue-500">
              Purpose
            </th>
            <th className="text-left text-xl border p-2 border-blue-500">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer, index) => (
            <tr
              key={index}
              className={`${
                index % 2 === 0 ? "bg-gray-200" : ""
              } border-blue-500`}
            >
              <td className="border p-2 border-blue-500">
                {transfer.recipient}
              </td>
              <td className="border p-2 border-blue-500">
                {transfer.amount} ETH
              </td>
              <td className="border p-2 border-blue-500">{transfer.purpose}</td>
              <td className="border p-2 border-blue-500">
                {transfer.timestamp}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
