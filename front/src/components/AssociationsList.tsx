"use client";
import { useState, useEffect } from "react";
import AddAssociation from "./AddAssociation";
import { contractDonationAddress, contractDonationAbi } from "@/constants";
import { ethers } from "ethers";

async function getWhitelistedAssociations() {
  const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
  const contractABI = contractDonationAbi;
  const contractAddress = contractDonationAddress;

  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  try {
    const associations = await contract.getWhitelistedAssociations();
    console.log('Whitelisted Associations:', associations);
    return associations;
  } catch (error) {
    console.error('Error fetching associations:', error);
  }
}


const AssociationsList = () => {
  const [associations, setAssociations] = useState<string[]>([]);
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

  const handleAddAssociation = () => {
    fetchAssociations();
  };

  if (isLoading) return <p>Loading associations...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <AddAssociation refetch={handleAddAssociation} />
      <h2 className="text-blue-800 text-3xl font-extrabold mb-4 mt-10">
        Associations List
      </h2>
      {associations.length > 0 ? (
        <ul>
          {associations.map((association, index) => (
            <li className="text-black" key={index}>
              {association}
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
