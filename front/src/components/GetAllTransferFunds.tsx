"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractDonationAddress, contractDonationAbi } from "@/constants";

interface TransferRecord {
  association: string;
  associationName: string;
  recipient: string;
  amount: string;
  purpose: string;
  timestamp: string;
}

const GetAllTransferFunds: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllTransfers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const provider = new ethers.JsonRpcProvider(
          "https://sepolia-rollup.arbitrum.io/rpc"
        );
        const contract = new ethers.Contract(
          contractDonationAddress,
          contractDonationAbi,
          provider
        );

        // Obtenez la liste de toutes les associations
        const [associationAddresses] =
          await contract.getWhitelistedAssociations(0, 1000);

        // Récupérez les transferts pour chaque association
        const allTransfers = await Promise.all(
          associationAddresses.map(async (address: string) => {
            const transferRecords = await contract.getTransfersByAssociation(
              address
            );
            const [associationName] = await contract.getAssociationDetails(
              address
            );
            return transferRecords.map((record: any) => ({
              association: address,
              associationName: associationName,
              recipient: record.recipient,
              amount: ethers.formatEther(record.amount),
              purpose: record.purpose,
              timestamp: new Date(
                Number(record.timestamp) * 1000
              ).toLocaleString(),
            }));
          })
        );

        // Aplatir le tableau de tableaux en un seul tableau
        const flattenedTransfers = allTransfers.flat();

        // Trier les transferts par date (du plus récent au plus ancien)
        flattenedTransfers.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setTransfers(flattenedTransfers);
      } catch (err) {
        console.error("Error fetching transfers:", err);
        setError("Failed to fetch transfers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTransfers();
  }, []);

  if (isLoading)
    return <p className="text-black text-xl">Loading transfers...</p>;
  if (error) return <p className="text-black text-xl">Error: {error}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-4xl font-semibold text-center mb-8 text-black">
        View All Transfer Funds
      </h2>
      <p className="text-black mb-8">
        Donation Transparency: this section displays all
        the fund transfers made by the associations. This ensures that the
        donor always know where their donations are going.
      </p>

      <div className="overflow-x-auto">
      <table className="min-w-full bg-white text-black border border-gray-300">
          <thead className="bg-gray-300 hidden md:table-header-group">
            <tr>
              <th className="px-4 py-2 text-left border-b border-gray-300">From Association</th>
              <th className="px-4 py-2 text-left border-b border-gray-300">Wallet</th>
              <th className="px-4 py-2 text-left border-b border-gray-300">To Recipient</th>
              <th className="px-4 py-2 text-left border-b border-gray-300">Amount</th>
              <th className="px-4 py-2 text-left border-b border-gray-300">Purpose</th>
              <th className="px-4 py-2 text-left border-b border-gray-300">Date</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer, index) => (
              <tr key={index} className="border-b border-gray-300 md:border-none block md:table-row ">
                <td className="px-4 py-2 block md:table-cell border-b md:border-b-0 border-gray-300 bg-gray-200">
                  <span className="font-bold md:hidden inline-block mb-2 ">From Association: </span>
                  {" "}{transfer.associationName}
                </td>
                <td className="px-4 py-2 block md:table-cell border-b md:border-b-0 border-gray-300">
                  <span className="font-bold md:hidden inline-block mb-2">Wallet: </span>
                  {" "}{transfer.association}
                </td>
                <td className="px-4 py-2 block md:table-cell border-b md:border-b-0 border-gray-300">
                  <span className="font-bold md:hidden inline-block mb-2">To Recipient: </span>
                  {" "}{transfer.recipient}
                </td>
                <td className="px-4 py-2 block md:table-cell border-b md:border-b-0 border-gray-300">
                  <span className="font-bold md:hidden inline-block mb-2">Amount: </span>
                  {" "}{transfer.amount}{" "} ETH
                </td>
                <td className="px-4 py-2 block md:table-cell border-b md:border-b-0 border-gray-300">
                  <span className="font-bold md:hidden inline-block mb-2">Purpose: </span>
                  {" "}{transfer.purpose}
                </td>
                <td className="px-4 py-2 block md:table-cell border-b md:border-b-0 border-gray-300">
                  <span className="font-bold md:hidden inline-block mb-2">Date: </span>
                  {" "}{transfer.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GetAllTransferFunds;
