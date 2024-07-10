"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractDonationAddress, contractDonationAbi } from "@/constants";

const GetContractBalance = () => {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
        const contract = new ethers.Contract(contractDonationAddress, contractDonationAbi, provider);

        const balanceWei = await contract.getContractBalance();
        const balanceEth = ethers.formatEther(balanceWei);

        setBalance(balanceEth);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching contract balance:", err);
        setError("Failed to fetch contract balance");
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, []);

  if (isLoading) return <p>Loading contract balance...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <h2 className="text-blue-800 text-3xl font-extrabold mb-4 pt-10">Contract Balance</h2>
      <div className="mb-4 p-4 border rounded-lg shadow-sm">
      <p className="text-lg text-black">{balance} ETH</p>
    </div>
    </>
  );
};

export default GetContractBalance;