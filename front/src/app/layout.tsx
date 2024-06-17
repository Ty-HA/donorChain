import React from "react";
import CustomRainbowKitProvider from "./CustomRainbowKitProvider";
import { RainbowKitSiweNextAuthProvider } from '@rainbow-me/rainbowkit-siwe-next-auth';
import { Metadata } from "next";

import "./globals.css";

import { Inter } from "next/font/google";
//import Head from "next/head";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const inter = Inter({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Donor Chain",
  description: "Donation platform powered by blockchain technology",
  keywords: "web3, blockchain, donations, charity, transparency, NFTs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Donor Chain</title>
      </head>
      <body className={inter.className}>
        <CustomRainbowKitProvider>
          <NavBar />
          <main className="flex flex-col items-center justify-between">
            {children}
          </main>
          <Footer />
        </CustomRainbowKitProvider>
      </body>
    </html>
  );
}
