"use client";
import { useState, useEffect } from "react";
import AddAssociation from "./AddAssociation";
import RemoveAssociation from "./RemoveAssociation";
import { contractDonationAddress, contractDonationAbi } from "@/constants";
import { ethers } from "ethers";

async function getWhitelistedAssociations() {
  const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
  const contractABI = contractDonationAbi;
  const contractAddress = contractDonationAddress;

  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  try {
    const associationAddresses = await contract.getWhitelistedAssociations();
    const associationsDetails = await Promise.all(associationAddresses.map(async (address: string) => {
      const details = await contract.associations(address);
      return {
        address,
        name: details.name,
        postalAddress: details.postalAddress,
        rnaNumber: details.rnaNumber,
        addedDate: new Date(Number(details.lastDeposit) * 1000).toLocaleDateString()
      };
    }));
    console.log('Whitelisted Associations:', associationsDetails);
    return associationsDetails;
  } catch (error) {
    console.error('Error fetching associations:', error);
    throw error;
  }
}

interface Association {
  address: string;
  name: string;
  postalAddress: string;
  rnaNumber: string;
  addedDate: string;
}

const AssociationsList = () => {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssociations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAssociations = await getWhitelistedAssociations();
      setAssociations(fetchedAssociations);
    } catch (err) {
      setError("Failed to fetch associations");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
  }, []);

  const handleAssociationChange = () => {
    fetchAssociations();
  };

  if (isLoading) return <p>Loading associations...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <AddAssociation refetch={handleAssociationChange} />
      <RemoveAssociation refetch={handleAssociationChange} />
      <h2 className="text-blue-800 text-3xl font-extrabold mb-4 mt-10">
        Associations List
      </h2>
      {associations.length > 0 ? (
        <ul>
          {associations.map((association, index) => (
            <li key={index} className="mb-4 p-4 border rounded-lg shadow-sm">
              <p className="font-bold text-lg text-black">Name: {association.name}</p>
              <p className="text-sm text-black">Wallet Address: {association.address}</p>
              <p className="text-sm text-black">Postal Address: {association.postalAddress}</p>
              <p className="text-sm text-black">RNA Number: {association.rnaNumber}</p>
              <p className="text-sm text-black">Added Date: {association.addedDate}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-black">No associations found.</p>
      )}
    </div>
  );
};

export default AssociationsList;