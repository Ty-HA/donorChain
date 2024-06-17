"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Navbar, Dropdown } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import ConnectWallet from "./ConnectWallet";
// import CrossmarkButton from "./CrossmarkButton";
// import Web3AuthLogin from "./web3auth/Web3AuthLogin";

export default function NavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <Navbar fluid rounded className="top-0 w-full py-4 z-10 bg-[15,16,46] ">
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
        <Navbar.Collapse>
          <Navbar.Link
            href="/"
            className="text-lg flex justify-left items-center text-black font-bold"
          >
            Home
          </Navbar.Link>
          <Navbar.Link
            href="/"
            className="text-lg flex justify-left items-center text-black font-bold"
          >
            Join Us
          </Navbar.Link>
          <Navbar.Link
            href="/"
            className="text-lg flex justify-left items-center text-black font-bold"
          >
            Our projects
          </Navbar.Link>
          <Navbar.Link
            href="/"
            className="text-lg flex justify-left items-center text-black font-bold"
          >
            Associations
          </Navbar.Link>
          <Navbar.Link
            href="#"
            className="text-lg flex justify-left items-center text-black font-bold"
          >
            About Us
          </Navbar.Link>
          <Navbar.Link
            href="#contact"
            className="text-lg flex justify-left items-center text-black font-bold"
          >
            Contact
          </Navbar.Link>
          
          {/*<Navbar.Link href="/" onClick={(e) => e.preventDefault()}>
            <Dropdown
              label=""
              dismissOnClick={false}
              renderTrigger={() => <span className="bg-blue-500 text-white py-2 px-4 rounded-xl text-lg">Login</span>}
            >
              <Dropdown.Item>As Association</Dropdown.Item>
              <Dropdown.Item>As Donator</Dropdown.Item>
              
            </Dropdown>
          </Navbar.Link>*/}
          <Navbar.Link
            href="/"
            className="text-lg flex justify-left items-center text-black"
          >
            <FontAwesomeIcon icon={faCog} className="mr-4 my-1" />
          </Navbar.Link>
          <ConnectWallet />
        </Navbar.Collapse>
      </Navbar>
    </>
  );
}
