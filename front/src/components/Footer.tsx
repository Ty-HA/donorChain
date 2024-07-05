"use client";
import "@fortawesome/fontawesome-free/css/all.css";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="flex sm:flex-row flex-col items-center py-4 md:mb-0 bg-[15,16,46] z-10 border-t border-blue-900">
      <div className="flex flex-row items-center justify-center flex-grow text-black">
        Our github :
        <a
          href="https://github.com/Ty-HA/donorChain"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fab fa-github fa-xl mx-2"></i>
        </a>
      </div>
      <div className="text-red-600 mx-6 my-4">
        <strong className="font-bold">Disclaimer:</strong>{" "}
        <p>
          This DApp was developed as part of a school project. It is deployed on
          the Arbitrum Sepolia testnet.
        </p>{" "}
        <p>
          The authors are not responsible for any losses or damages resulting
          from the use of this application.
        </p>
      </div>
    </footer>
  );
}
