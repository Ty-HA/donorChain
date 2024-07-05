import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const ConnectWallet = () => {
  const { address, isConnected } = useAccount();
  return (
    <div className="flex justify-center">
      {isConnected ? (
        // Utilisez text-sm pour les petits écrans et text-base pour les tailles supérieures
        <p className="text-sm sm:text-base">Connected with {address}</p>
      ) : (
        // Utilisez text-sm pour les petits écrans et text-base pour les tailles supérieures
        <p className="text-sm sm:text-base"></p>
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