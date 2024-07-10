"use client";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractDonationAddress, contractDonationAbi } from "@/constants";
import { ethers } from "ethers";

type RemoveAssociationProps = {
  refetch: () => void;
};

const RemoveAssociation = ({ refetch }: RemoveAssociationProps) => {
  const [associationAddr, setAssociationAddr] = useState("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { writeContract, data: writeData } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const checkAssociationBalance = async (address: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia-rollup.arbitrum.io/rpc"
      );
      const contract = new ethers.Contract(
        contractDonationAddress,
        contractDonationAbi,
        provider
      );
      const associationDetails = await contract.getAssociationDetails(address);
      return associationDetails.balance;
    } catch (error) {
      console.error("Error checking association balance:", error);
      return null;
    }
  };

  const removeAssociation = async () => {
    if (!associationAddr) {
      alert("Please enter the association address");
      return;
    }

    const balance = await checkAssociationBalance(associationAddr);
    console.log("Balance:", balance);
    if (balance === null) {
      alert("Error checking association balance. Please try again.");
      return;
    }

    if (balance > BigInt(0)) {
      const balanceInEth = ethers.formatEther(balance);
      alert(
        `Cannot remove association with remaining balance. Remaining balance = ${balanceInEth} ETH. Please withdraw all funds first.`
      );
      return;
    }

    try {
      await writeContract({
        address: contractDonationAddress,
        abi: contractDonationAbi,
        functionName: "removeAssociation",
        args: [associationAddr],
      });
    } catch (error) {
      console.error("Error removing association:", error);
      alert("Error removing association. Check console for details.");
    }
  };

  const clearForm = () => {
    setAssociationAddr("");
  };

  useEffect(() => {
    if (writeData) {
      setHash(writeData);
    }
  }, [writeData]);

  useEffect(() => {
    if (isConfirmed) {
      alert("Association removed successfully!");
      refetch();
      clearForm();
    }
  }, [isConfirmed, refetch]);

  return (
    <>
      <h2 className="text-blue-800 text-3xl font-extrabold mb-4 mt-10">
        Remove Association
      </h2>

      <div className="flex flex-col space-y-4">
        <input
          name="associationAddr"
          placeholder="Association wallet address"
          onChange={(e) => setAssociationAddr(e.target.value)}
          value={associationAddr}
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
            color: "#000",
          }}
        />
        <Button
          onClick={removeAssociation}
          disabled={isConfirming}
          className="bg-red-500 hover:bg-red-700 text-white"
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          {isConfirming ? "Removing..." : "Remove association"}
        </Button>
      </div>
    </>
  );
};

export default RemoveAssociation;
