"use client";
import Image from "next/image";
import Projects from "@/components/Projects";
import TotalDonations from "@/components/TotalDonations";
import Contact from "@/components/Contact";

const ButtonStart = () => {
  return (
    <a
      href="#projects"
      className="bg-[#92CD00] hover:bg-[#5aa73b] active:bg-[#92CD00] text-white sm:px-12 px-4 mt-8 py-3 sm:py-1.5 md:py-4 text-lg font-semibold rounded-full whitespace-nowrap"
    >
      DONATE NOW →
    </a>
  );
};

const FirstSection = () => {
  return (
    <section className="flex sm:flex-row flex-col-reverse justify-around items-center pb-20 w-full bg-blue-800 pt-20">
      <div className="sm:w-1/2 xl:pl-60 lg:pl-32 px-8">
        <Image
          src="/logo.png"
          alt="DonorChain logo"
          className="rounded-[30px]"
          width="250"
          height="100"
        />

        <h2
          style={{ lineHeight: "1.2" }}
          className="text-white mt-6 xl:text-5xl lg:text-3xl text-2xl font-semibold mb-12 leading-loose"
        >
          Transparency in every donation, powered by blockchain technology
        </h2>

        <ButtonStart />
      </div>
      <div className="sm:w-1/2 xl:pr-60 lg:pr-32 px-8">
        <Image
          src="/images/home.png"
          alt="home image"
          width="600"
          height="600"
          className="rounded-[25px]"
        />
      </div>
    </section>
  );
};

const information = (title: string, paragraph: string, srcImage: string) => {
  return (
    <div className="lg:w-1/4 px-2 min-h-7 flex flex-col">
      <div className="flex flex-col items-center">
        <Image
          src={srcImage}
          color="#ECAA00"
          className="w-24 h-24 justify-center mb-4 border-2 rounded-full border-green-500"
          alt="Icon"
          width="500"
          height="500"
        />
        <h1
          className="text-black xl:text-xl lg:text-l text-m font-semibold whitespace-normal
      "
        >
          {title}
        </h1>
      </div>
      <p className="text-gray-500 whitespace-normal mt-4 mb-8 xl:text-l text-m  text-center">
        {paragraph}
      </p>
    </div>
  );
};

const explication = (
  title: string,
  paragraph: string,
  srcImage: string,
  direction: boolean
) => {
  return (
    <section
      className={`flex ${
        direction ? "sm:flex-row" : "sm:flex-row-reverse"
      } flex-col justify-center mt-16 sm:px-32 px-4 w-full bg-white`}
    >
      <div
        className={`sm:w-1/2 px-4 ${
          direction ? "xl:pl-60 lg:pl-32 sm:pl-8" : "xl:pr-60 lg:pr-32 sm:pr-8"
        }`}
      >
        <Image src={srcImage} alt="Pet" width="400" height="500" />
      </div>
      <div
        className={`sm:w-1/2 px-4 ${
          direction ? "xl:pr-60 lg:pr-32 sm:pr-8" : "xl:pl-60 lg:pl-32 sm:pl-8"
        }`}
      >
        <h1
          className="text-black font-bold xl:text-5xl lg:text-3xl text-2xl whitespace-normal
        "
        >
          {title}
        </h1>
        <p className="text-gray-500 whitespace-normal mt-8 mb-8 mr-8 xl:text-xl text-l">
          {paragraph}
        </p>
        <ButtonStart />
      </div>
    </section>
  );
};

const App = () => {
  return (
    <>
      {FirstSection()}
      <div id="projects" className="flex flex-col items-center w-full bg-white">
        <Projects />
      </div>
      <div id="projects" className="flex flex-col items-center w-full bg-blue-800 mt-10">
        <TotalDonations />
      </div>
      <div className="bg-white mb-8">
        <section className="flex lg:flex-row flex-col justify-around pt-12 sm:px-32 px-4 w-full bg-white">
          {information(
            "Healthcare",
            "To provide better care",
            "/icons/book-medical.png"
          )}
          {information(
            "A Community",
            "Worldwide community",
            "/icons/people-community.png"
          )}
          {information("Innovation", "Blockchain technology", "/icons/bc.png")}
          {information("Transparent", "Description", "/icons/donation.png")}
        </section>
      </div>
      <Contact />
    </>
  );
};

export default App;
