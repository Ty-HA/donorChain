"use client";
import React, { useEffect, useState } from "react";
import {
  contractDonationProofSBTAddress,
  contractDonationProofSBTAbi,
  contractDonationBadgeNFTAddress,
  contractDonationBadgeNFTAbi,
  contractDonationAddress,
  contractDonationAbi,
} from "@/constants";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import AddAssociation from "@/components/AddAssociation";
import AssociationsList from "@/components/AssociationsList";

import { Button } from "flowbite-react";

const authorizedAddress = "0x8E9B6101776469f4F5e57d509fee35751dBbA54A";

export default function Admin() {
  const { address, isConnected } = useAccount();

  return (
    <>
      {isConnected ? (
        address!.toLowerCase() === authorizedAddress.toLowerCase() ? (
          <div className="min-h-screen">
            <h2 className="text-green-500 mb-4 font-bold text-3xl text-center mt-8">
              ADMIN DASHBOARD
            </h2>
            <p className="text-black mb-12 text-xl text-center">
              Connected with <span className="text-blue-700">{address}</span>
            </p>
            {/* Admin Buttons */}
            <div className="space-y-2 flex flex-col">              
                <AssociationsList />
              <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
                Remove Association
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
                Update Association Wallet
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
                Update Association Postal Address
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
                Get the whitelist
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
                Check My Balance
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
                Withdraw My Commissions
              </Button>
              <Button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Pause the Contract
              </Button>
              <Button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                UnPause the Contract
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-screen">
            <h2 className="text-red-600 mb-4 font-bold text-3xl text-center mt-8">
              ACCESS DENIED
            </h2>
            <p className="text-red-600 mb-24 text-center font-bold">
              You are not authorized to access this page.
            </p>
          </div>
        )
      ) : (
        <div>
          <h2 className="text-black mb-4 font-bold text-xl">ADMIN DASHBOARD</h2>
          <p className="text-black mb-24">Please connect your wallet</p>
        </div>
      )}
    </>
  );
}
