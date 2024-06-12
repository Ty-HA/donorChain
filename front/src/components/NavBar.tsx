"use client";

import { useState } from "react";
import Image from "next/image";
import { Navbar } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";
// import CrossmarkButton from "./CrossmarkButton";
import Web3AuthLogin from "./web3auth/Web3AuthLogin";

export default function NavBar() {
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
          <Navbar.Link href="/">
            <a
              href="/loginHome"
              className="bg-[#92CD00] hover:bg-[#5aa73b] active:bg-[#92CD00] text-white sm:px-4 px-4 mt-8 py-3 sm:py-1.5 md:py-2 text-lg font-semibold rounded-full whitespace-nowrap"
            >
              LOGIN
            </a>
          </Navbar.Link>
          <Navbar.Link
            href="/"
            className="text-lg flex justify-left items-center text-black"
          >
            <FontAwesomeIcon icon={faCog} className="mr-4 my-1" />
          </Navbar.Link>
        </Navbar.Collapse>
      </Navbar>
    </>
  );
}
