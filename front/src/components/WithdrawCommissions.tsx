import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Button } from 'flowbite-react';
import { contractDonationAddress, contractDonationAbi } from "@/constants";

const WithdrawCommissions: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Vérifier si MetaMask est installé et connecté
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractDonationAddress, contractDonationAbi, signer);

        // Appeler la fonction withdrawCommissions
        const tx = await contract.withdrawCommissions();
        await tx.wait();

        setSuccess('Commissions withdrawn successfully!');
      } else {
        setError('Please install MetaMask to use this feature.');
      }
    } catch (err) {
      console.error('Error withdrawing commissions:', err);
      setError('Failed to withdraw commissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleWithdraw} 
        disabled={isLoading}
        className="hover:bg-gray-600 bg-gray-700 text-white"
        style={{
          border: "1px solid #ccc",
          padding: "8px",
          borderRadius: "4px",
        }}
      >
        {isLoading ? 'Processing...' : 'Withdraw Commissions'}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </>
  );
};

export default WithdrawCommissions;