'use client';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import AddAssociation from './AddAssociation';  // Assurez-vous que le chemin d'importation est correct
import {
    contractDonationAddress,
    contractDonationAbi,
} from "@/constants";

const AssociationsList = () => {
    const [associations, setAssociations] = useState<string[]>([]);

    const { data: associationData, refetch } = useReadContract({
        address: contractDonationAddress,
        abi: contractDonationAbi,
        functionName: 'associationList',
        args: [0],
    });

    useEffect(() => {
        if (associationData) {
            setAssociations(associationData as string[]);
        }
    }, [associationData]);

    return (
        <div>
        <AddAssociation refetch={refetch} />
        <h2 className="text-blue-800 text-3xl font-extrabold mb-4 mt-10">Associations List</h2>
        {associations.length > 0 ? (
            <ul>
                {associations.map((association, index) => (
                    <li className="text-black" key={index}>{association}</li>
                ))}
            </ul>
        ) : (
            <p className="text-black" >No associations found.</p>
        )}
    </div>
    );
};

export default AssociationsList;