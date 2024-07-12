import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractDonationAddress, contractDonationAbi } from "@/constants";

export function useUserRole() {
  const [userRole, setUserRole] = useState<
    "disconnected" | "admin" | "association" | "donor"
  >("disconnected");
  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

  useEffect(() => {
    const checkUserRole = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          // Demander la permission de se connecter aux comptes
          await window.ethereum.request({ method: "eth_requestAccounts" });

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();

          const contract = new ethers.Contract(
            contractDonationAddress,
            contractDonationAbi,
            provider
          );

          if (address === adminAddress) {
            setUserRole("admin");
            return;
          }

           // Vérifier si l'adresse est une association whitelistée
           const isWhitelisted = await contract.isWhitelisted(address);
           if (isWhitelisted) {
             setUserRole("association");
             return;
           }

          // Double vérification avec les détails de l'association
          const associationDetails = await contract.associations(address);
          if (associationDetails.whitelisted) {
            setUserRole("association");
            return;
          }

          setUserRole("donor");
        } catch (error) {
          console.error("An error occurred while checking user role:", error);
          setUserRole("disconnected");
        }
      } else {
        console.log("Please install MetaMask!");
        setUserRole("disconnected");
      }
    };

    checkUserRole();
  }, [adminAddress]);

  return userRole;
}
