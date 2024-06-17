import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const ConnectWallet = () => {
  const { address, isConnected } = useAccount();
  return (
    <div className="flex justify-center">
      {isConnected ? (
        <p>Connected with {address}</p>
      ) : (
        <p>Please connect your Wallet.</p>
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
