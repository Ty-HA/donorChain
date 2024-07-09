import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { FaUserCircle } from 'react-icons/fa';
import { Button, Modal } from 'flowbite-react';
import { contractDonationAddress, contractDonationAbi } from "@/constants";

interface DonorInfo {
  address: string;
}

interface DonationInfo {
  associationAddress: string;
  amount: string;
}

interface GetDonorsForOneAssociationProps {
  associationAddress: string;
}

const GetDonorsForOneAssociation: React.FC<GetDonorsForOneAssociationProps> = ({ associationAddress }) => {
  const [donors, setDonors] = useState<DonorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<string | null>(null);
  const [totalDonation, setTotalDonation] = useState<string>('0');
  const [donationInfo, setDonationInfo] = useState<DonationInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDonors = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
        const contract = new ethers.Contract(contractDonationAddress, contractDonationAbi, provider);

        const donationRecords = await contract.getDonationsByAssociation(associationAddress);
        
        const uniqueDonors = [...new Set(donationRecords.map((record: any) => record.donor))];
        
        setDonors(uniqueDonors.map(address => ({ address })));
      } catch (err) {
        console.error("Error fetching donors:", err);
        setError("Failed to fetch donors");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonors();
  }, [associationAddress]);

  const fetchDonorInfo = async (donorAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
      const contractABI = contractDonationAbi;
      const contractAddress = contractDonationAddress;
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const totalDonationBigNumber = await contract.getTotalDonationsFromOneDonor(donorAddress);
      const totalDonationEther = ethers.formatEther(totalDonationBigNumber);
      setTotalDonation(totalDonationEther);

      const allAssociations = await contract.getWhitelistedAssociations();
      const donationPromises = allAssociations.map(async (assoc: string) => {
        const donations = await contract.getDonationsByAssociation(assoc);
        const donorDonations = donations.filter((d: any) => d.donor === donorAddress);
        if (donorDonations.length > 0) {
          const totalAmount = donorDonations.reduce((sum: ethers.BigNumber, d: any) => sum.add(d.amount), ethers.BigNumber.from(0));
          return {
            associationAddress: assoc,
            amount: ethers.formatEther(totalAmount)
          };
        }
        return null;
      });

      const donationInfo = (await Promise.all(donationPromises)).filter((d): d is DonationInfo => d !== null);
      setDonationInfo(donationInfo);
    } catch (err) {
      console.error("Error fetching donor info:", err);
      setError("Failed to fetch donor information");
    }
  };

  const handleDonorClick = async (donorAddress: string) => {
    setSelectedDonor(donorAddress);
    await fetchDonorInfo(donorAddress);
    setIsModalOpen(true);
  };

  if (isLoading) return <p className="text-black">Loading donors...</p>;
  if (error) return <p className="text-black">Error: {error}</p>;

  return (
    <div>
      <h2 className="text-black text-xl">Donors:</h2>
      <ul>
        {donors.map((donor, index) => (
          <li key={index} className="text-black text-md flex items-center cursor-pointer" onClick={() => handleDonorClick(donor.address)}>
            <FaUserCircle className="mr-2" />
            {donor.address}
          </li>
        ))}
      </ul>

      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header>Donation Information for {selectedDonor}</Modal.Header>
        <Modal.Body>
          <p className="text-black font-bold">Total Donations: {totalDonation} ETH</p>
          <h3 className="text-black font-bold mt-4">Donations by Association:</h3>
          <ul>
            {donationInfo.map((info, index) => (
              <li key={index} className="text-black">
                <p>Association: {info.associationAddress}</p>
                <p>Amount: {info.amount} ETH</p>
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GetDonorsForOneAssociation;