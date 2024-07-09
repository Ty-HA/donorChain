import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import {
  contractDonationBadgeNFTAddress,
  contractDonationBadgeNFTAbi,
} from "@/constants";

interface BadgeDetailsProps {
  donorAddress: string;
}

interface BadgeDetail {
  id: string;
  tier: string;
  timestamp: string;
  imageUrl?: string;
}

const BadgeNFTDetails: React.FC<BadgeDetailsProps> = ({ donorAddress }) => {
  const [badges, setBadges] = useState<BadgeDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const provider = new ethers.JsonRpcProvider(
          "https://sepolia-rollup.arbitrum.io/rpc"
        );
        const contract = new ethers.Contract(
          contractDonationBadgeNFTAddress,
          contractDonationBadgeNFTAbi,
          provider
        );

        const badgeIds = await contract.getDonorBadges(donorAddress);

        const badgeDetails = await Promise.all(
          badgeIds.map(async (id: bigint) => {
            const details = await contract.getBadgeDetails(id);
            const tierName = await contract.getTierName(details.tier);
            const tokenURI = await contract.tokenURI(id);

            let imageUrl = "";
            if (tokenURI.startsWith("ipfs://")) {
              const ipfsHash = tokenURI.slice(7);
              const metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
              const response = await fetch(metadataUrl);
              const metadata = await response.json();
              imageUrl = metadata.image.replace(
                "ipfs://",
                "https://gateway.pinata.cloud/ipfs/"
              );
            }

            return {
              id: id.toString(),
              tier: tierName,
              timestamp: new Date(
                Number(details.timestamp) * 1000
              ).toLocaleString(),
              imageUrl,
            };
          })
        );

        setBadges(badgeDetails);
      } catch (err) {
        console.error("Error fetching badges:", err);
        setError("Failed to fetch badges");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [donorAddress]);

  if (isLoading) return <p className="text-black">Loading badges...</p>;
  if (error) return <p className="text-black">Error: {error}</p>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-black mt-6">
        Donor Badges:
      </h3>
      {badges.length > 0 ? (
        <ul>
          {badges.map((badge, index) => (
            <li key={index} className="text-black">
              Badge ID: {badge.id} - Tier: {badge.tier} - Earned on:{" "}
              {badge.timestamp}
              {badge.imageUrl && (
                <Image
                  src={badge.imageUrl}
                  alt={`Badge ${badge.id}`}
                  className="mt-2 w-32 h-32"
                  width="100"
                  height="200"
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-black">No badges earned yet.</p>
      )}
    </div>
  );
};

export default BadgeNFTDetails;
