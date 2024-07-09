"use client";
import { useState } from "react";
import { contractDonationAddress, contractDonationAbi } from "@/constants";
import { ethers } from "ethers";
import { Button } from "flowbite-react";

const CheckCommissions = () => {
  const [commissions, setCommissions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckCommissions = async () => {
    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia-rollup.arbitrum.io/rpc"
      );
      const contract = new ethers.Contract(contractDonationAddress, contractDonationAbi, provider);
      
      const commissionsBigInt = await contract.getAccumulatedCommissions();
      const formattedCommissions = ethers.formatEther(commissionsBigInt);
      setCommissions(formattedCommissions);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      setCommissions("Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
<>
      <h2 className="text-blue-800 text-3xl font-extrabold mb-4">
        Accumulated Commissions
      </h2>
      
      {commissions !== null && (
        <p className="text-black mt-4 mb-4 p-4 border rounded-lg shadow-sm">
          {commissions === "Error"
            ? "Error fetching commissions"
            : `${commissions} ETH`}
        </p>
      )}
      <Button 
        onClick={handleCheckCommissions} 
        className="hover:bg-gray-600 bg-gray-700 text-white"
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
          }}
        disabled={isLoading}
      >
        {isLoading ? "Checking..." : "Check Commissions"}
      </Button>
</>
  );
};

export default CheckCommissions;