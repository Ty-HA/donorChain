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
    <>
      <h2 className="text-4xl font-semibold text-center pt-12 text-black">
        View All Transfer Funds
      </h2>
      <p className="text-black px-32 pt-10">
        Donation Transparency DonationChain includes a section that displays all
        the fund transfers made by the associations. This ensures that as a
        donor, you always know where your donations are going. You can see when
        associations unlock funds after verification by the platform. This
        feature provides transparency and accountability, giving donors
        confidence that their contributions are being used as intended.
      </p>

      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">All Transfer Funds</h2>
        <table className="min-w-full bg-white text-black text-left">
          <thead>
            <tr>
              <th className="px-4 py-2 text-black">From Association</th>
              <th className="px-4 py-2 text-black">Wallet</th>
              <th className="px-4 py-2 text-black">To Recipient</th>
              <th className="px-4 py-2 text-black">Amount (ETH)</th>
              <th className="px-4 py-2 text-black">Purpose</th>
              <th className="px-4 py-2 text-black">Date</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                <td className="border px-4 py-2">{transfer.associationName}</td>
                <td className="border px-4 py-2">{transfer.association}</td>
                <td className="border px-4 py-2">{transfer.recipient}</td>
                <td className="border px-4 py-2">{transfer.amount}</td>
                <td className="border px-4 py-2">{transfer.purpose}</td>
                <td className="border px-4 py-2">{transfer.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GetAllTransferFunds;
