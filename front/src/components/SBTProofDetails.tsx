import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import { Card } from "flowbite-react";
import {
  contractDonationAddress,
  contractDonationAbi,
  contractDonationProofSBTAddress,
  contractDonationProofSBTAbi,
} from "@/constants";

const SBT_BACKGROUND_IMAGE =
  "https://gateway.pinata.cloud/ipfs/QmX9NEQtAUtX1wUZHzhDRe7XE1uYUBMBxN5waFYLgMxaFp";

interface SBTProofDetailsProps {
  donorAddress: string;
}

interface DonationProof {
  donor: string;
  amount: string;
  association: string;
  timestamp: string;
  blockNumber: string;
}

const SBTProofDetails: React.FC<SBTProofDetailsProps> = ({ donorAddress }) => {
  const [proofs, setProofs] = useState<DonationProof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSBTProofs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const provider = new ethers.JsonRpcProvider(
          "https://sepolia-rollup.arbitrum.io/rpc"
        );
        const sbtContract = new ethers.Contract(
          contractDonationProofSBTAddress,
          contractDonationProofSBTAbi,
          provider
        );
        const donationContract = new ethers.Contract(
          contractDonationAddress,
          contractDonationAbi,
          provider
        );

        const tokenIds = await sbtContract.getDonorTokens(donorAddress);

        const proofPromises = tokenIds.map(
          async (tokenId: ethers.BigNumberish) => {
            const proofDetails = await donationContract.getDonationProofDetails(
              tokenId
            );
            return {
              donor: proofDetails.donor,
              amount: ethers.formatEther(proofDetails.amount),
              association: proofDetails.association,
              timestamp: new Date(
                Number(proofDetails.timestamp) * 1000
              ).toLocaleString(),
              blockNumber: proofDetails.blockNumber.toString(),
            };
          }
        );

        const fetchedProofs = await Promise.all(proofPromises);
        setProofs(fetchedProofs);
      } catch (err) {
        console.error("Error fetching SBT proofs:", err);
        setError("Failed to fetch SBT proofs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSBTProofs();
  }, [donorAddress]);

  if (isLoading) return <p>Loading SBT proofs...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3 className="text-black font-bold mt-4">SBT Proofs:</h3>

      {proofs.map((proof, index) => (
        <Card
          key={index}
          className="mt-8 max-w-4xl mx-auto overflow-hidden bg-white"
        >
          <div
            className="relative w-full"
            style={{ maxWidth: "800px", margin: "0 auto" }}
          >
            <Image
              src={SBT_BACKGROUND_IMAGE}
              alt="SBT Background"
              width={600}
              height={420}
              layout="responsive"
              quality={100}
            />
            <div className="absolute inset-0 flex p-10">
              <div className="text-amber-100 w-full mt-12">
                <h3 className="font-bold text-xl mb-2">
                  Donation Proof #{index + 1}
                </h3>
                <div className="flex flex-col">
                  <p>
                    <span className="font-semibold">Donor:</span>
                  </p>
                  <p className="mb-2 text-sm">{proof.donor}</p>

                  <p className="mb-2">
                  <span className="font-semibold">Amount:</span> {proof.amount} ETH
                  </p>

                  <p>
                    <span className="font-semibold">Association:</span>
                  </p>
                  <p className="mb-2 text-sm">{proof.association}</p>

                  <p className="mb-2"><span className="font-semibold ">Date:</span> {proof.timestamp}</p>

                  <p className=""><span className="font-semibold ">Block:</span> {proof.blockNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SBTProofDetails;
