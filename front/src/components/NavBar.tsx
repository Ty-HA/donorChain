"use client";

import React from "react";
import Image from "next/image";
import { Navbar } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import ConnectWallet from "./ConnectWallet";

export default function NavBar() {
  const navLinkClass = "text-lg flex items-center text-black font-bold h-full";

  return (
    <>
      <Navbar fluid rounded className="top-0 w-full py-4 z-10 bg-[15,16,46]">
        <Navbar.Brand href="/">
          <Image
            src="/logo.png"
            alt="DonorChain logo"
            className=""
            width="200"
            height="100"
          />
        </Navbar.Brand>

        <Navbar.Toggle />
        <Navbar.Collapse className="items-center">
          <Navbar.Link href="/" className={navLinkClass}>
            Home
          </Navbar.Link>
          <Navbar.Link href="/#contact" className={navLinkClass}>
            Join Us
          </Navbar.Link>
          <Navbar.Link href="/#projects" className={navLinkClass}>
            Our projects
          </Navbar.Link>
          <Navbar.Link href="/associationDashboard" className={navLinkClass}>
            Dashboard
          </Navbar.Link>
          <Navbar.Link href="/#contact" className={navLinkClass}>
            Contact
          </Navbar.Link>
          <Navbar.Link href="/admin" className={`${navLinkClass} text-green-500`}>
            ADMIN
          </Navbar.Link>
         
          <div className="flex items-center h-full">
            <ConnectWallet />
          </div>
        </Navbar.Collapse>
      </Navbar>
    </>
  );
}