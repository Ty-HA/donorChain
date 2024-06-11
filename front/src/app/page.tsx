"use client";
import Image from "next/image";
import Contact from "@/components/Contact";
import { Card, Button } from "flowbite-react";

const ButtonStart = () => {
  return (
    <a
      href="/loginHome"
      className="bg-[#92CD00] hover:bg-[#5aa73b] active:bg-[#92CD00] text-white sm:px-12 px-4 mt-8 py-2 sm:py-1.5 md:py-3 text-lg font-semibold rounded-full whitespace-nowrap"
    >
      DONATE NOW →
    </a>
  );
};

const FirstSection = () => {
  return (
    <section className="flex sm:flex-row flex-col-reverse justify-end items-center pb-20 w-full bg-slate-200 pt-20">
      <div className="sm:w-1/2 xl:pl-60 lg:pl-32 px-8">
        <h1 className="text-black mt-4 xl:text-4xl lg:text-3xl text-2xl font-semibold mb-8 leading-loose">
          DONOR CHAIN LOGO
        </h1>
        <h2
          style={{ lineHeight: "1.2" }}
          className="text-black mt-4 xl:text-5xl lg:text-3xl text-2xl font-semibold mb-12 leading-loose"
        >
          Transparency in every donation, powered by blockchain technology.
        </h2>

        <ButtonStart />
      </div>
      <div className="sm:w-1/2 xl:pr-60 lg:pr-32 px-8">
        <Image
          src="/images/home.png"
          alt="home image"
          width="600"
          height="600"
        />
      </div>
    </section>
  );
};

const information = (title: string, paragraph: string, srcImage: string) => {
  return (
    <div className="lg:w-1/4 px-2 min-h-7">
      <div className="flex items-center flex-row">
        <Image
          src={srcImage}
          color="#ECAA00"
          className="w-8 h-8 mr-4 justify-center"
          alt="Icon"
          width="200"
          height="200"
        />
        <h1
          className="text-black xl:text-xl lg:text-l text-m font-semibold whitespace-normal
      "
        >
          {title}
        </h1>
      </div>
      <p className="text-gray-500 whitespace-normal mt-8 mb-8 mr-8 xl:text-l text-m">
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
      <div className="flex flex-col items-center w-full bg-white">
          <h2 className="text-4xl font-semibold text-center pt-8 text-black">
            Your help is Needed
          </h2>

          <section className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-2 pt-12 sm:px-32 px-4 w-full">
            <div className="flex flex-col">
              <Card imgSrc="/images/card1.png" className="flex flex-col h-full">
                <div className="flex justify-between items-center">
                  <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Help Azar to continue his study
                  </h5>
                  <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Education
                  </span>
                </div>
                <p className="font-normal text-gray-700 dark:text-gray-400 flex-grow">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                {/* Barre de progression des dons */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: "75%" }}
                  ></div>
                </div>
                <Button className="bg-green-500 text-white hover:bg-green-700">
                  Donate
                </Button>
              </Card>
            </div>

            <div className="flex flex-col">
              <Card imgSrc="/images/card2.png" className="flex flex-col h-full">
                <div className="flex justify-between items-center">
                  <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Save Peter life
                  </h5>
                  <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Health
                  </span>
                </div>
                <p className="font-normal text-gray-700 dark:text-gray-400 flex-grow">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                {/* Barre de progression des dons */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: "20%" }}
                  ></div>
                </div>
                <Button className="bg-green-500 text-white hover:bg-green-700">
                  Donate
                </Button>
              </Card>
            </div>

            <div className="flex flex-col">
              <Card imgSrc="/images/card3.png" className="flex flex-col h-full">
                <div className="flex justify-between items-center">
                  <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Build School for poor students
                  </h5>
                  <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    School construction
                  </span>
                </div>
                <p className="font-normal text-gray-700 dark:text-gray-400 flex-grow">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                {/* Barre de progression des dons */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: "50%" }}
                  ></div>
                </div>
                <Button className="bg-green-500 text-white hover:bg-green-700">
                  Donate
                </Button>
              </Card>
            </div>
          </section>
        </div>
      <div className="bg-white pb-8">
        <section className="flex lg:flex-row flex-col justify-around pt-12 sm:px-32 px-4 w-full bg-white">
          {information(
            "Access Medical Records",
            "Healthcare professionals can access comprehensive medical histories to provide better care.",
            "/icons/book-medical.png"
          )}
          {information(
            "A Supportive Community",
            "Donors and recipients can access transparent information about the origins and impacts of their contributions, fostering trust and community.",
            "/icons/people-community.png"
          )}
          {information(
            "Healthcare Initiatives",
            "Donate to help healthcare organizations in their mission to provide care and support to those in need.",
            "/icons/donation.png"
          )}
        </section>

        
      </div>
      <Contact />
    </>
  );
};

export default App;
