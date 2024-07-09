"use client";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { contractDonationAddress, contractDonationAbi } from "@/constants";

type AddAssociationProps = {
  refetch: () => void;
};

const AddAssociation = ({ refetch }: AddAssociationProps) => {
  const { address } = useAccount();
  const [associationAddr, setAssociationAddr] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [postalAddress, setPostalAddress] = useState("");
  const [rnaNumber, setRnaNumber] = useState("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { writeContract, data: writeData } = useWriteContract();

  
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const addAssociation = async () => {
    if (!associationAddr || !associationName || !postalAddress || !rnaNumber) {
      alert("Please fill all fields");
      return;
    }

    try {
      await writeContract({
        address: contractDonationAddress,
        abi: contractDonationAbi,
        functionName: "addAssociation",
        args: [associationAddr, associationName, postalAddress, rnaNumber],
      });
    } catch (error) {
      console.error("Error adding association:", error);
      alert("Error adding association. Check console for details.");
    }
  };

  const clearForm = () => {
    setAssociationAddr("");
    setAssociationName("");
    setPostalAddress("");
    setRnaNumber("");
  };

  useEffect(() => {
    if (writeData) {
      setHash(writeData);
    }
  }, [writeData]);

  useEffect(() => {
    if (isConfirmed) {
      alert("Association added successfully!");
      refetch();
      clearForm();
    }
  }, [isConfirmed, refetch]);

  return (
    <>
      <h2 className="text-blue-800 text-3xl font-extrabold mb-4">
        Add Association
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
        <input
          name="associationName"
          placeholder="Association name"
          onChange={(e) => setAssociationName(e.target.value)}
          value={associationName}
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
            color: "#000",
          }}
        />
        <input
          name="postalAddress"
          placeholder="Postal address"
          onChange={(e) => setPostalAddress(e.target.value)}
          value={postalAddress}
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
            color: "#000",
          }}
        />
        <input
          name="rnaNumber"
          placeholder="RNA number"
          onChange={(e) => setRnaNumber(e.target.value)}
          value={rnaNumber}
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
            color: "#000",
          }}
        />
        <Button
          onClick={addAssociation}
          disabled={isConfirming}
          className="hover:bg-gray-600 bg-gray-700 text-white"
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          {isConfirming ? "Adding..." : "Add association"}
        </Button>
      </div>
    </>
  );
};

export default AddAssociation;
