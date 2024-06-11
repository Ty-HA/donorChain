import React from "react";
import { Metadata } from "next";

import "./globals.css";

import { Inter } from "next/font/google";
//import Head from "next/head";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const inter = Inter({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pawesome ID",
  description: "Decentralized Passport for pets",
  keywords: "web, web3, passport, blockchain, pet, dog, cat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Pawesome ID</title>
      </head>
      <body className={inter.className}>
        <>
        <NavBar/>

      <main className="flex flex-col items-center justify-between">        
      {children}
      </main>
      <Footer/>
        </>
        </body>
    </html>
  );
}
