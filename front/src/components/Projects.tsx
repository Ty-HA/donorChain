"use client";
import { useState } from "react";
import Image from "next/image";
import { Card, Button, Modal } from "flowbite-react";
import { FaUserCircle } from "react-icons/fa";

interface Contributor {
  address: string;
  donations: number;
  amount: string;
  date: string;
}

const contributors: Contributor[] = [
  {
    address: "0x632E...B22ea2F55",
    donations: 5,
    amount: "100 ETH",
    date: "2023-04-01",
  },
  {
    address: "0xecB5...4a43426",
    donations: 3,
    amount: "50 ETH",
    date: "2023-03-25",
  },
  {
    address: "0xe968...6De62b4c",
    donations: 2,
    amount: "25 ETH",
    date: "2023-03-20",
  },
];

// Définissez une interface pour une donation
interface Donation {
  id: string;
  amount: number;
  project: string;
  date: string;
  contributors: string;
}

// Créez un tableau de toutes les donations (ceci pourrait venir d'une API dans une application réelle)
const allDonations: Donation[] = [
  {
    id: "1",
    amount: 5,
    project: "Help Azar",
    date: "2023-07-01",
    contributors: "0x632E...B22ea2F55",
  },
  {
    id: "2",
    amount: 10,
    project: "Save Peter",
    date: "2023-07-02",
    contributors: "0xecB5...4a43426",
  },
  {
    id: "3",
    amount: 15,
    project: "Build School",
    date: "2023-07-03",
    contributors: "0xe968...6De62b4c",
  },
  {
    id: "4",
    amount: 7,
    project: "Help Azar",
    date: "2023-07-04",
    contributors: "0x632E...B22ea2F55",
  },
  {
    id: "5",
    amount: 12,
    project: "Save Peter",
    date: "2023-07-05",
    contributors: "0xecB5...4a43426",
  },
];

// Créez un composant pour afficher le résumé des donations
const DonationSummary = () => {
  const [showAllDonations, setShowAllDonations] = useState(false);
  const totalDonations = allDonations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );

  return (
    <div className="text-black shadow-md rounded-lg p-6 my-6">
      <h2 className="text-2xl font-bold mb-4">Résumé des Donations</h2>
      <p className="text-xl mb-4">Total des donations: {totalDonations} ETH</p>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setShowAllDonations(!showAllDonations)}
      >
        {showAllDonations ? "Masquer les détails" : "Voir toutes les donations"}
      </button>
      {showAllDonations && (
        <ul className="mt-4">
          {allDonations.map((donation) => (
            <li key={donation.id} className="mb-2">
              {donation.amount} ETH pour {donation.project} le {donation.date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DonationTimeline = () => {
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(
    null
  );
  const totalDonations = allDonations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );

  // Fonction pour calculer la taille de la bulle en fonction du montant
  const getBubbleSize = (amount: number) => {
    const minSize = 30;
    const maxSize = 80;
    const size = minSize + (amount / 15) * (maxSize - minSize); // 15 est le montant max dans cet exemple
    return Math.min(Math.max(size, minSize), maxSize);
  };

  return (
    <div className="bg-gray-400 shadow-md rounded-lg p-6 my-6 px-60">
      <h2 className="text-2xl font-bold mb-4">
        Total des donations: {totalDonations} ETH
      </h2>
      <div className="relative h-[200px] border-b-2 border-gray-300">
        {allDonations.map((donation, index) => {
          const bubbleSize = getBubbleSize(donation.amount);
          return (
            <div
              key={donation.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110"
              style={{
                left: `${(index / (allDonations.length - 1)) * 100}%`,
                bottom: "0",
              }}
              onClick={() => setSelectedDonation(donation)}
            >
              <div
                className="rounded-full bg-blue-500 flex items-center justify-center text-white font-bold"
                style={{
                  width: `${bubbleSize}px`,
                  height: `${bubbleSize}px`,
                }}
              >
                {donation.amount} ETH
              </div>
              <div className="mt-2 text-xs text-center">{donation.date}</div>
            </div>
          );
        })}
      </div>
      {selectedDonation && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg relative">
          <button
            onClick={() => setSelectedDonation(null)}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h3 className="font-bold text-black">{selectedDonation.project}</h3>
          <p className="font-bold text-black">
            Montant: {selectedDonation.amount} ETH
          </p>
          <p className="font-bold text-black">Date: {selectedDonation.date}</p>
          <p className="font-bold text-black">
            Donor: {selectedDonation.contributors}
          </p>
        </div>
      )}
    </div>
  );
};

const Projects = () => {
  const [selectedContributor, setSelectedContributor] =
    useState<Contributor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <h2 className="text-4xl font-semibold text-center pt-8 text-black">
        Your help is Needed
      </h2>

      <section className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-2 pt-12 sm:px-32 px-4 w-full">
        <div className="flex flex-col">
          <Card
            imgSrc="/images/card1.png"
            className="flex flex-col h-full border-2 border-gray-300"
          >
            <div className="flex justify-between items-center">
              <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Help Azar to continue his study
              </h5>

              <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-blue-300 text-blue-800 text-center">
                Education
              </span>
            </div>
            <h5 className="text-md font-bold tracking-tight text-gray-900 dark:text-white">
              Association 1
            </h5>
            <p className="font-normal text-gray-700 dark:text-gray-400 flex-grow">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
            {/* Barre de progression des dons */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: "75%" }}
              ></div>
            </div>
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
              Total raised: 10ETH ($31223,55)
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button className="bg-green-500 text-white hover:bg-green-700 font-bold">
                Donate now
              </Button>
              <Button className="bg-yellow-400 text-white hover:bg-green-700 font-bold">
                Share
              </Button>
            </div>
            <h2 className="text-black text-xl">Contributors:</h2>
            <ul>
              {contributors.map((contributor, index) => (
                <li
                  key={index}
                  className="text-black text-md flex items-center cursor-pointer"
                  onClick={() => handleContributorClick(contributor)}
                >
                  <FaUserCircle className="mr-2" />
                  {contributor.address}
                </li>
              ))}
            </ul>
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
          </Card>
        </div>

        <div className="flex flex-col">
          <Card
            imgSrc="/images/card2.png"
            className="flex flex-col h-full border-2 border-gray-300"
          >
            <div className="flex justify-between items-center">
              <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Save Peter life
              </h5>
              <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-green-300 text-blue-800 text-center">
                Health
              </span>
            </div>
            <h5 className="text-md font-bold tracking-tight text-gray-900 dark:text-white">
              Association 2
            </h5>
            <p className="font-normal text-gray-700 dark:text-gray-400 flex-grow">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
            {/* Barre de progression des dons */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: "20%" }}
              ></div>
            </div>
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
              Total raised: 10ETH ($31223,55)
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button className="bg-green-500 text-white hover:bg-green-700 font-bold">
                Donate now
              </Button>
              <Button className="bg-yellow-400 text-white hover:bg-green-700 font-bold">
                Share
              </Button>
            </div>
            <h2 className="text-black text-xl">Contributors:</h2>
            <ul>
              {contributors.map((contributor, index) => (
                <li
                  key={index}
                  className="text-black text-md flex items-center cursor-pointer"
                  onClick={() => handleContributorClick(contributor)}
                >
                  <FaUserCircle className="mr-2" />
                  {contributor.address}
                </li>
              ))}
            </ul>
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
          </Card>
        </div>

        <div className="flex flex-col">
          <Card
            imgSrc="/images/card3.png"
            className="flex flex-col h-full border-2 border-gray-300"
          >
            <div className="flex justify-between items-center">
              <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Build School for poor students
              </h5>
              <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-fuchsia-300 text-blue-800 text-center">
                School construction
              </span>
            </div>
            <h5 className="text-md font-bold tracking-tight text-gray-900 dark:text-white">
              Association 3
            </h5>
            <p className="font-normal text-gray-700 dark:text-gray-400 flex-grow">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            {/* Barre de progression des dons */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: "50%" }}
              ></div>
            </div>
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
              Total raised: 10ETH ($31223,55)
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button className="bg-green-500 text-white hover:bg-green-700 font-bold">
                Donate now
              </Button>
              <Button className="bg-yellow-400 text-white hover:bg-green-700 font-bold">
                Share
              </Button>
            </div>
            <h2 className="text-black text-xl">Contributors:</h2>
            <ul>
              {contributors.map((contributor, index) => (
                <li
                  key={index}
                  className="text-black text-md flex items-center cursor-pointer"
                  onClick={() => handleContributorClick(contributor)}
                >
                  <FaUserCircle className="mr-2" />
                  {contributor.address}
                </li>
              ))}
            </ul>
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
          </Card>
        </div>
      </section>
    </>
  );
};

export default Projects;
