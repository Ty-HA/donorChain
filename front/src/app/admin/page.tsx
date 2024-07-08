"use client";
import { useUserRole } from '@/hooks/userRole';
import AssociationsList from "@/components/AssociationsList";
import CheckCommissions from "@/components/CheckCommissions";
import { Button } from "flowbite-react";

export default function Admin() {
  const userRole = useUserRole();

  if (userRole === 'disconnected') {
    return (
      <div>
        <h2 className="text-black mb-4 font-bold text-xl">ADMIN DASHBOARD</h2>
        <p className="text-black mb-24">Please connect your wallet</p>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen">
        <h2 className="text-red-600 mb-4 font-bold text-3xl text-center mt-8">
          ACCESS DENIED
        </h2>
        <p className="text-red-600 mb-24 text-center font-bold">
          You are not authorized to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <h2 className="text-green-500 mb-4 font-bold text-3xl text-center mt-8">
        ADMIN DASHBOARD
      </h2>
      <p className="text-black mb-12 text-xl text-center">
        Connected as Admin
      </p>
      {/* Admin Buttons */}
      <div className="space-y-2 flex flex-col mb-10">
        <AssociationsList />
        <CheckCommissions />
        <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
          Withdraw My Commissions
        </Button>
        <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
          Update Association Wallet
        </Button>
        <Button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
          Update Association Postal Address
        </Button>
        <Button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Pause the Contract
        </Button>
        <Button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          UnPause the Contract
        </Button>
      </div>
    </div>
  );
}