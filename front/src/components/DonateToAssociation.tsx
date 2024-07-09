import React, { useState, useEffect } from 'react';
import { Button, Modal, Label, TextInput } from 'flowbite-react';
import { ethers } from 'ethers';
import { contractDonationAddress, contractDonationAbi } from "@/constants";

interface DonateToAssociationProps {
  associationAddress: string;
  associationName: string;
}

const DonateToAssociation: React.FC<DonateToAssociationProps> = ({ associationAddress, associationName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => {
    // Fetch current ETH price in USD
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
      }
    };

    fetchEthPrice();
  }, []);

  useEffect(() => {
    if (amount && ethPrice) {
      const usdValue = parseFloat(amount) * ethPrice;
      setAmountUSD(usdValue.toFixed(2));
    } else {
      setAmountUSD('');
    }
  }, [amount, ethPrice]);

  const handleDonate = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to make donations.');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractDonationAddress, contractDonationAbi, signer);

      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.donateToAssociation(associationAddress, amountInWei, { value: amountInWei });
      await tx.wait();

      alert('Donation successful!');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error making donation:', error);
      alert('Error making donation. Please try again.');
    }
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className="bg-[#4fd92c] text-white hover:bg-green-700 font-bold">
        Donate now
      </Button>

      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header>Donate to {associationName}</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <Label htmlFor="amount" value="Amount in ETH" />
              <TextInput
                id="amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {amountUSD && (
              <div>
                <p className="text-black">Equivalent in USD: ${amountUSD}</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className="bg-[#4fd92c] text-white hover:bg-green-700 font-bold" onClick={handleDonate}>Confirm Donation to {associationName}</Button>
          <Button color="gray" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DonateToAssociation;