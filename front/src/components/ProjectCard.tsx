"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, Button, Modal } from "flowbite-react";
import { FaAddressCard, FaWallet } from "react-icons/fa";
import { contractDonationAddress, contractDonationAbi } from "@/constants";
import DonateToAssociation from "./DonateToAssociation";
import GetDonorsForOneAssociation from "./GetDonorsForOneAssociation";
import { ethers } from "ethers";

// TO DO CHANGE DESCR and CATEGORY IN DYNAMIC DATA IN SMART CONTRACT
const ProjectDescription: string[] = [
  "Help Azar to continue his study",
  "Save Peter life",
  "Build School for poor students",
  "Help Azar to continue his study",
  "Save Peter life",
  "Build School for poor students",
];

const ProjectCategories: string[] = [
  "Education",
  "Health",
  "School Building",
  "Education",
  "Health",
  "School Building",
];

interface Contributor {
  address: string;
  donations: number;
  amount: string;
  date: string;
}

interface Association {
  address: string;
  name: string;
  postalAddress: string;
  rnaNumber: string;
  addedDate: string;
  balance: string;
  totalDonations: string;
}

interface DonationRecord {
  donor: string;
  amount: string;
  timestamp: string;
  blockNumber: string;
}

async function getWhitelistedAssociations() {
  const provider = new ethers.JsonRpcProvider(
    "https://sepolia-rollup.arbitrum.io/rpc"
  );
  const contract = new ethers.Contract(
    contractDonationAddress,
    contractDonationAbi,
    provider
  );

  try {
    const associationAddresses = await contract.getWhitelistedAssociations();
    const associationsDetails = await Promise.all(
      associationAddresses.map(async (address: string) => {
        const details = await contract.associations(address);
        const totalDonations = await contract.getTotalDonationsToAssociation(
          address
        );
        return {
          address,
          name: details.name,
          postalAddress: details.postalAddress,
          rnaNumber: details.rnaNumber,
          addedDate: new Date(
            Number(details.lastDeposit) * 1000
          ).toLocaleDateString(),
          balance: ethers.formatEther(details.balance),
          totalDonations: ethers.formatEther(totalDonations),
        };
      })
    );
    console.log("Whitelisted Associations:", associationsDetails);
    return associationsDetails;
  } catch (error) {
    console.error("Error fetching associations:", error);
    throw error;
  }
}

const ProjectCard = () => {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContributor, setSelectedContributor] =
    useState<Contributor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ethPrice, setEthPrice] = useState(0);

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

  useEffect(() => {
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

    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
      }
    };

    fetchAssociations();
    fetchEthPrice();
  }, []);

  const refreshAssociations = async () => {
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

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) return <p>Loading associations...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <h2 className="text-4xl font-semibold text-center pt-8 text-black">
        Your help is Needed
      </h2>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-10 px-4 sm:px-6 lg:px-8 w-full">
        {associations.map((association, index) => (
          <div key={index} className="flex flex-col">
            <Card
              imgSrc={`/images/card${index + 1}.png`}
              className="flex flex-col h-full border-2 border-gray-300"
            >
              <div className="flex justify-between items-center">
                <h5 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {association.name}
                </h5>
                <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-blue-300 text-blue-800 text-center">
                  {ProjectCategories[index] || "Category"}
                </span>
              </div>
              <p className=" text-black flex items-center break-all">
                <FaWallet className="mr-2 flex-shrink-0" />
                <span className="truncate text-md md:text-md text-black ">{association.address}</span>
              </p>
              <p className="text-black text-md flex items-center">
                <FaAddressCard className="mr-2" />
                {association.postalAddress}
              </p>
              <p className="text-black text-md flex items-center">
                RNA Number: {association.rnaNumber}
              </p>
              <p className="text-xl font-normal text-black dark:text-gray-400 flex-grow mt-4 mb-4">
                {ProjectDescription[index] || "No description available."}
              </p>

              <div className="text-black text-xl flex items-center">
                <svg
                  width="40"
                  height="45"
                  viewBox="0 0 800 1300"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <polygon
                      fill="#343434"
                      fillRule="nonzero"
                      points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"
                    />
                    <polygon
                      fill="#8C8C8C"
                      fillRule="nonzero"
                      points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33"
                    />
                    <polygon
                      fill="#3C3C3B"
                      fillRule="nonzero"
                      points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89"
                    />
                    <polygon
                      fill="#8C8C8C"
                      fillRule="nonzero"
                      points="392.07,1277.38 392.07,956.52 -0,724.89"
                    />
                    <polygon
                      fill="#141414"
                      fillRule="nonzero"
                      points="392.07,882.29 784.13,650.54 392.07,472.33"
                    />
                    <polygon
                      fill="#393939"
                      fillRule="nonzero"
                      points="0,650.54 392.07,882.29 392.07,472.33"
                    />
                  </g>
                </svg>
                <div className="flex items-center justify-center">
                  <div className="flex flex-col">
                    <span className="text-xs">Total donations</span>
                    <div className="flex">
                      <span>{association.totalDonations} ETH</span>
                      <span className="text-md text-gray-400 pl-2">
                        (
                        {formatUSD(
                          parseFloat(association.totalDonations) * ethPrice
                        )}
                        )
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                <DonateToAssociation
                  associationAddress={association.address}
                  associationName={association.name}
                />
                <Button className="bg-yellow-400 text-white hover:bg-green-700 font-bold">
                  Share
                </Button>
              </div>
              <div className="h-24 sm:h-24 overflow-y-auto my-2 sm:my-4">
                <GetDonorsForOneAssociation
                  associationAddress={association.address}
                  maxDonors={3}
                />
              </div>
            </Card>
          </div>
        ))}
      </section>

      {selectedContributor && (
        <Modal show={isModalOpen} onClose={closeModal}>
          <Modal.Header>
            Contributor {selectedContributor?.address} Details
          </Modal.Header>
          <Modal.Body>
            <div className="text-black text-xl">
              <div>Donations: {selectedContributor?.donations}</div>
              <div>Amount: {selectedContributor?.amount}</div>
              <div>Date: {selectedContributor?.date}</div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
};

export default ProjectCard;
