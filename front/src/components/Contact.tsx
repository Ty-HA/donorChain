"use client";
import React, { useEffect } from "react";
import { Button, Label, Textarea, TextInput } from "flowbite-react";
import { HiMail } from "react-icons/hi";

export default function Contact() {
  useEffect(() => {
    // Réinitialise le formulaire au chargement de la page
    const formElement = document.getElementById("form") as HTMLFormElement;
    formElement?.reset();
  }, []);

  return (
    <section
      id="contact"
      className="w-screen h-[75vh] flex flex-col items-center justify-center text-center z-0 bg-blue-400"
    >
      <div className="md:h-[70vh] h-[75vh] rounded-3xl md:w-1/3 animate-fade-in w-full">
        <div className="flex flex-col justify-center px-4">
          <h2 className="text-white text-2xl font-bold md:text-4xl mt-10">
            Contact Us
          </h2>
          <form
            id="form"
            action="https://api.web3forms.com/submit"
            method="POST"
          >
            <input
              type="hidden"
              name="access_key"
              value={process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY}
            />
            <div className="text-left mb-2">
              <Label htmlFor="name" className="">Name</Label>
              <TextInput
                type="text"
                name="name"
                required
                placeholder="Your name"
                
              />
            </div>
            <div className="text-left mb-2">
              <Label htmlFor="email">Email</Label>
              <TextInput
                type="email"
                name="email"
                required
                placeholder="email@example.com"
               
              />
            </div>
            <div className="text-left mb-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                name="message"
                required
                placeholder="Enter your message"
                rows={10}
                
              ></Textarea>
            </div>
            <input
              className="bg-[#4fd92c] hover:bg-[#c48200] active:bg-[#4fd92c] text-lg text-white mt-8 py-2 px-4 rounded-xl mx-auto"
              type="hidden"
              name="redirect"
              value="https://web3forms.com/success"
            />
            <Button
              size="md"
              className="bg-[#4fd92c] hover:bg-[#c48200] active:bg-[#4fd92c] text-white mt-8 py-2 px-4 rounded-xl mx-auto"
              type="submit"
            >
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
