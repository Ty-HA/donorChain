'use client';
import React, { useState } from "react";

interface Donation {
  id: string;
  amount: number;
  project: string;
  date: string;
  contributors: string;
}

const generateSixMonthsOfDonations = () => {
  const donations = [];
  const projects = ["Help Azar", "Save Peter", "Build School"];
  const contributors = [
    "0x632E...B22ea2F55",
    "0xecB5...4a43426",
    "0xe968...6De62b4c",
  ];

  for (let i = 0; i < 150; i++) {
    const date = new Date(2024, 0, 1);
    date.setDate(date.getDate() + i);

    if (Math.random() < 0.3) {
      // 30% chance of a donation each day
      donations.push({
        id: `${i}`,
        amount: Math.floor(Math.random() * 20) + 1, // Random amount between 1 and 20
        project: projects[Math.floor(Math.random() * projects.length)],
        date: date.toISOString().split("T")[0],
        contributors:
          contributors[Math.floor(Math.random() * contributors.length)],
      });
    }
  }

  return donations;
};

const allDonations = generateSixMonthsOfDonations();

const DonationTimeline = () => {
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(
    null
  );
  const [hoveredDonation, setHoveredDonation] = useState<Donation | null>(null);
  const totalDonations = allDonations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );

  const getXPosition = (date: string) => {
    const donationDate = new Date(date);
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 5, 30);
    const totalDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed =
      (donationDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return (daysPassed / totalDays) * 100;
  };

  const getYPosition = (amount: number) => {
    return 100 - (amount / 10) * 100; // Ajusté pour 0-10 ETH
  };

  const getBubbleSize = (amount: number) => {
    const minSize = 5;
    const maxSize = 20;
    return minSize + (amount / 10) * (maxSize - minSize); // Ajusté pour 0-10 ETH
  };

  return (
    <div className="bg-gray-100 shadow-md rounded-lg p-6 my-24 w-5/6">
      <h2 className="text-2xl font-bold text-black mb-10">
        Total donations on DonorChain (6 months): {totalDonations.toFixed(2)}{" "}
        ETH
      </h2>
      <div className="relative h-[400px] border-b-2 border-l-2 border-gray-300 mb-8">
        {allDonations.map((donation) => {
          const xPos = getXPosition(donation.date);
          const yPos = getYPosition(donation.amount);
          const bubbleSize = getBubbleSize(donation.amount);
          return (
            <div
              key={donation.id}
              className="absolute w-5 h-5 bg-blue-500 rounded-full cursor-pointer transition-all duration-200 hover:scale-150 text-black"
              style={{
                left: `${xPos}%`,
                bottom: `${yPos}%`,
                width: `${bubbleSize}px`,
                height: `${bubbleSize}px`,
                transform: 'translate(-50%, 50%)',
                
              }}
              onClick={() => setSelectedDonation(donation)}
              onMouseEnter={() => setHoveredDonation(donation)}
              onMouseLeave={() => setHoveredDonation(null)}
            >
              {hoveredDonation === donation && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-blue-300 p-2 rounded shadow-md text-xs z-10 w-30 text-center whitespace-nowrap">
                  <div className="font-bold">{donation.amount} ETH</div>
                  <div>{donation.project}</div>
                  <div>{donation.date}</div>
                  <div>{donation.contributors}</div>
                </div>
              )}
            </div>
          );
        })}
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => (
          <div
            key={month}
            className="absolute bottom-[-30px] text-md text-black"
            style={{ left: `${(index / 5) * 100}%` }}
          >
            <div className="mt-6">{month}</div>
          </div>
        ))}
      </div>
      {selectedDonation && (
        <div className="mt-10 p-4 bg-white rounded-lg relative">
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
            Amount: {selectedDonation.amount} ETH
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

export default DonationTimeline;
