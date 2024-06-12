"use client"
import '@fortawesome/fontawesome-free/css/all.css';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer
      className="flex sm:flex-row flex-col items-center py-4 md:mb-0 bg-[15,16,46] z-10 border-t border-blue-900"

    >
      
      <div className="flex flex-row items-center justify-center flex-grow text-black">

     Contact us :
    <i className="fab fa-facebook fa-xl mx-2"></i>
    <i className="fab fa-twitter fa-xl mx-2"></i>
    <i className="fab fa-instagram fa-xl mx-2"></i>
    <i className="fab fa-linkedin fa-xl mx-2"></i>
      </div>
      


    </footer>
  );
}