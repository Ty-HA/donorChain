"use client";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { contractDonationAddress, contractDonationAbi } from "@/constants";

type UpdateAssociationPostalAddrProps = {
  refetch: () => void;
};

const UpdateAssociationPostalAddr = ({ refetch }: UpdateAssociationPostalAddrProps) => {
  const { address } = useAccount();
  const [associationAddr, setAssociationAddr] = useState("");
  const [postalAddress, setPostalAddress] = useState("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { writeContract, data: writeData } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const updatePostalAddr = async () => {
    if (!associationAddr || !postalAddress) {
      alert("Please fill all fields");
      return;
    }

    try {
      await writeContract({
        address: contractDonationAddress,
        abi: contractDonationAbi,
        functionName: "updateAssociationPostalAddr",
        args: [associationAddr, postalAddress],
      });
    } catch (error) {
      console.error("Error updating association postal address:", error);
      alert("Error updating association postal address. Check console for details.");
    }
  };

  const clearForm = () => {
    setAssociationAddr("");
    setPostalAddress("");
  };

  useEffect(() => {
    if (writeData) {
      setHash(writeData);
    }
  }, [writeData]);

  useEffect(() => {
    if (isConfirmed) {
      alert("Association postal address updated successfully!");
      refetch();
      clearForm();
    }
  }, [isConfirmed, refetch]);

  return (
    <>
      <h2 className="text-blue-800 text-3xl font-extrabold mb-4 mt-10">
        Update Association Postal Address
      </h2>

      <div className="flex flex-col space-y-4">
        <input
          name="associationAddr"
          placeholder="Association address"
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
          name="postalAddress"
          placeholder="New postal address"
          onChange={(e) => setPostalAddress(e.target.value)}
          value={postalAddress}
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
            color: "#000",
          }}
        />
        <Button
          onClick={updatePostalAddr}
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

export default UpdateAssociationPostalAddr;