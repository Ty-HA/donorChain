import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { FaUserCircle } from "react-icons/fa";
import { Button, Modal } from "flowbite-react";
import {
  contractDonationAddress,
  contractDonationAbi,
  contractDonationBadgeNFTAddress,
  contractDonationBadgeNFTAbi,
} from "@/constants";
import SBTProofDetails from "./SBTProofDetails";
import BadgeNFTDetails from "./BadgeNFTDetail";

interface DonorInfo {
  address: string;
}

interface GetDonorsForOneAssociationProps {
  associationAddress: string;
  maxDonors?: number;
}

const GetDonorsForOneAssociation: React.FC<GetDonorsForOneAssociationProps> = ({
  associationAddress,
  maxDonors = 3,
}) => {
  const [donors, setDonors] = useState<DonorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<string | null>(null);
  const [totalDonation, setTotalDonation] = useState<string>("0");
  const [SBTProof, setSBTProof] = useState<string>("");
  const [badge, setBadge] = useState<string>("");
  const [hasBadge, setHasBadge] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllDonors, setShowAllDonors] = useState(false);

  useEffect(() => {
    const fetchDonors = async () => {
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

        const donationRecords = await contract.getDonationsByAssociation(
          associationAddress
        );

        const uniqueDonorsMap: { [key: string]: boolean } = {};
        donationRecords.forEach((record: any) => {
          if (record.donor) {
            uniqueDonorsMap[record.donor] = true;
          }
        });

        const uniqueDonors = Object.keys(uniqueDonorsMap);
        setDonors(uniqueDonors.map((address) => ({ address })));
      } catch (err) {
        console.error("Error fetching donors:", err);
        setError("Failed to fetch donors");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonors();
  }, [associationAddress]);

  const fetchTotalDonation = async (donorAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia-rollup.arbitrum.io/rpc"
      );
      const contract = new ethers.Contract(
        contractDonationAddress,
        contractDonationAbi,
        provider
      );

      const totalDonationBigNumber =
        await contract.getTotalDonationsFromOneDonor(donorAddress);
      const totalDonationEther = ethers.formatEther(totalDonationBigNumber);
      setTotalDonation(totalDonationEther);
    } catch (err) {
      console.error("Error fetching total donation:", err);
      setError("Failed to fetch total donation");
    }
  };

  

  const handleDonorClick = async (donorAddress: string) => {
    setSelectedDonor(donorAddress);
    await fetchTotalDonation(donorAddress);
    await checkBadges(donorAddress);
    setIsModalOpen(true);
  };

  const checkBadges = async (donorAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia-rollup.arbitrum.io/rpc"
      );
      const contract = new ethers.Contract(
        contractDonationBadgeNFTAddress,
        contractDonationBadgeNFTAbi,
        provider
      );
      const badges = await contract.getDonorBadges(donorAddress);
      setHasBadge(badges.length > 0);
    } catch (err) {
      console.error("Error checking badges:", err);
    }
  };

  if (isLoading) return <p className="text-black">Loading donors...</p>;
  if (error) return <p className="text-black">Error: {error}</p>;

  const displayedDonors = showAllDonors ? donors : donors.slice(0, maxDonors);

  return (
    <div>
      <h2 className="text-black text-xl mb-2">Recent Donors:</h2>
      <ul>
        {displayedDonors.map((donor, index) => (
          <li
            key={index}
            className="text-black text-md sm:text-md flex items-center cursor-pointer pb-2 sm:p-1 hover:bg-blue-100 hover:text-blue-600 rounded transition duration-200 ease-in-out"
            onClick={() => handleDonorClick(donor.address)}
          >
            <FaUserCircle className="mr-2" />
            <span className="truncate">{donor.address}</span>
          </li>
        ))}
      </ul>
      {donors.length > maxDonors && !showAllDonors && (
        <div
          className="text-sm text-blue-600 cursor-pointer hover:underline mt-1"
          onClick={() => setShowAllDonors(true)}
        >
          See all
        </div>
      )}

      <Modal
        className="bg-black w-full"
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <Modal.Header>
          <h2 className="font-bold">Donation Proof for</h2>
          <span className="truncate text-xs md:text-base">{selectedDonor}</span>
          <p>
            <a
              href={`https://sepolia.arbiscan.io/address/${contractDonationAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600 text-xs md:text-base truncate"
            >
              View this transaction
            </a>
          </p>
        </Modal.Header>
        <Modal.Body>
          <p className="text-black text-xl">
            Total Donations:{" "}
            <span className="bg-lime-300">{totalDonation} ETH</span>
          </p>
          {SBTProof && <SBTProofDetails donorAddress={selectedDonor!} />}
          {badge && <BadgeNFTDetails donorAddress={selectedDonor!} />}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          <Button
            className="bg-[#4fd92c] text-white hover:bg-green-700 font-bold text-xs sm:text-sm md:text-base"
            onClick={() => setSBTProof(SBTProof ? "" : "show")}
          >
            {SBTProof ? "Hide SBT proof details" : "Show SBT proof details"}
          </Button>
          {hasBadge && (
            <Button
              className="bg-[#7633c8] text-white hover:bg-[#341a55] font-bold"
              onClick={() => setBadge(badge ? "" : "show")}
            >
              {badge ? "Hide Badge" : "Show Badge details"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GetDonorsForOneAssociation;
