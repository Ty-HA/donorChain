"use client";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { contractDonationAddress, contractDonationAbi } from "@/constants";

type UpdateAssociationNameProps = {
  refetch: () => void;
};

const UpdateAssociationName = ({ refetch }: UpdateAssociationNameProps) => {
  const { address } = useAccount();
  const [associationAddr, setAssociationAddr] = useState("");
  const [name, setName] = useState("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { writeContract, data: writeData } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const updateName = async () => {
    if (!associationAddr || !name) {
      alert("Please fill all fields");
      return;
    }

    try {
      await writeContract({
        address: contractDonationAddress,
        abi: contractDonationAbi,
        functionName: "updateAssociationName",
        args: [associationAddr, name],
      });
    } catch (error) {
      console.error("Error updating associationname:", error);
      alert("Error updating association name. Check console for details.");
    }
  };

  const clearForm = () => {
    setAssociationAddr("");
    setName("");
  };

  useEffect(() => {
    if (writeData) {
      setHash(writeData);
    }
  }, [writeData]);

  useEffect(() => {
    if (isConfirmed) {
      alert("Association Name updated successfully!");
      refetch();
      clearForm();
    }
  }, [isConfirmed, refetch]);

  return (
    <>
      <h2 className="text-blue-800 text-3xl font-extrabold mb-4 mt-10">
        Change Association Name
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
          name="name"
          placeholder="New name"
          onChange={(e) => setName(e.target.value)}
          value={name}
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
            color: "#000",
          }}
        />
        <Button
          onClick={updateName}
          disabled={isConfirming}
          className="hover:bg-gray-600 bg-gray-700 text-white"
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          {isConfirming ? "Updating..." : "Update"}
        </Button>
      </div>
    </>
  );
};

export default UpdateAssociationName;