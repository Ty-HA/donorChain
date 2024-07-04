"use client";
import React, { useState, useEffect } from "react";

interface Donation {
  id: string;
  amount: number;
  project: string;
  date: string;
  contributors: string;
}

const generateDonations = (): Donation[] => {
  const donations = [];
  const projects = ["Help Azar", "Save Peter", "Build School"];
  const contributors = [
    "0x632E...B22ea2F55",
    "0xecB5...4a43426",
    "0xe968...6De62b4c",
  ];

  for (let i = 0; i < 50; i++) {
    const date = new Date(2024, 0, 1);
    date.setDate(date.getDate() + Math.floor(Math.random() * 180)); // Random date within 6 months

    donations.push({
      id: `${i}`,
      amount: Math.random() * 10, // Random amount between 0 and 10 ETH
      project: projects[Math.floor(Math.random() * projects.length)],
      date: date.toISOString().split("T")[0],
      contributors:
        contributors[Math.floor(Math.random() * contributors.length)],
    });
  }

  return donations.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

const DonationTimeline: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(
    null
  );
  const [hoveredDonation, setHoveredDonation] = useState<Donation | null>(null);

  useEffect(() => {
    setDonations(generateDonations());
  }, []);

  const totalDonations = donations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );

  const getPosition = (donation: Donation) => {
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 5, 30);
    const donationDate = new Date(donation.date);

    const xPercent =
      ((donationDate.getTime() - startDate.getTime()) /
        (endDate.getTime() - startDate.getTime())) *
      100;
    const yPercent = (donation.amount / 10) * 100;

    return { x: xPercent, y: yPercent };
  };

  return (
    <div className="bg-gray-100 shadow-md rounded-lg p-6 my-24 w-5/6 mx-auto">
      <h2 className="text-2xl font-bold text-black mb-10">
        Total donations on DonorChain (6 months): {totalDonations.toFixed(2)}{" "}
        ETH
      </h2>
      <div className="relative h-[400px] border-b-2 border-l-2 border-gray-300 mb-8">
        {/* Y-axis labels */}
        {[10, 8, 6, 4, 2, 0].map((value) => (
          <div
            key={value}
            className="absolute left-[-40px] text-sm text-black"
            style={{ bottom: `${(value / 10) * 100}%` }}
          >
            {value} ETH
          </div>
        ))}

        {/* Donation points */}
        {donations.map((donation) => {
          const { x, y } = getPosition(donation);
          return (
            <div
              key={donation.id}
              className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:scale-150 transition-transform"
              style={{
                left: `${x}%`,
                bottom: `${y}%`,
                transform: 'translate(-50%, 50%)',
              }}
              onClick={() => setSelectedDonation(donation)}
              onMouseEnter={() => setHoveredDonation(donation)}
              onMouseLeave={() => setHoveredDonation(null)}
            >
              {hoveredDonation === donation && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-md text-xs z-10 w-40 text-center whitespace-nowrap">
                  <div className="font-bol text-black">{donation.amount.toFixed(2)} ETH</div>
                  <div className="font-bol text-black">{donation.project}</div>
                  <div className="font-bol text-black">{donation.date}</div>
                  <div className="font-bol text-black">{donation.contributors}</div>
                </div>
              )}
            </div>
          );
        })}
        

        {/* X-axis labels */}
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => (
          <div
            key={month}
            className="absolute bottom-[-30px] text-sm text-black"
            style={{ left: `${(index / 5) * 100}%` }}
          >
            {month}
          </div>
        ))}
      </div>

      {/* Selected donation details */}
      {selectedDonation && (
        <div className="mt-4 p-4 bg-white rounded-lg relative">
          <button
            onClick={() => setSelectedDonation(null)}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
          <h3 className="font-bold text-black">{selectedDonation.project}</h3>
          <p className="text-black">
            Amount: {selectedDonation.amount.toFixed(2)} ETH
          </p>
          <p className="text-black">Date: {selectedDonation.date}</p>
          <p className="text-black">Donor: {selectedDonation.contributors}</p>
        </div>
      )}
    </div>
  );
};

export default DonationTimeline;
