import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useUserRole } from "@/hooks/userRole";

import "@rainbow-me/rainbowkit/styles.css";

const ConnectWallet = () => {
  const { address, isConnected } = useAccount();
  const userRole = useUserRole();

  const getRoleText = () => {
    switch (userRole) {
      case "admin":
        return "Connected as Admin";
      case "association":
        return "Connected as Association";
      case "donor":
        return "Connected as Donor";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-row justify-center items-center">
      {isConnected ? (
        <p className="text-gray-600 text-sm sm:text-base mr-2">
          {getRoleText()}
        </p>
      ) : (
        <p className="text-gray-200 text-sm sm:text-base mr-2">Not connected</p>
      )}
      <ConnectButton
        label="Connect your wallet"
        accountStatus={{
          smallScreen: "avatar",
          largeScreen: "full",
        }}
        chainStatus="name"
        showBalance={false}
      />
    </div>
  );
};

export default ConnectWallet;