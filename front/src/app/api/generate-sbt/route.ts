import { NextResponse } from 'next/server';
import PinataClient from '@pinata/sdk';
import { DonationDetails } from '@/types';

interface PinataPinOptions {
    pinataMetadata: {
      name: string;
    };
    pinataOptions: {
      cidVersion?: 0 | 1;
    };
  }

const pinata = new PinataClient({ 
  pinataApiKey: process.env.PINATA_KEY as string, 
  pinataSecretApiKey: process.env.PINATA_SECRET as string 
});

function generateSVG(details: DonationDetails): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <style>
        .base { fill: black; font-family: Arial; font-size: 12px; }
      </style>
      <rect width="100%" height="100%" fill="white" stroke="blue" stroke-width="10"/>
      <text x="10" y="30" class="base">
        <tspan x="10" dy="1.2em">Token ID: ${details.tokenId}</tspan>
        <tspan x="10" dy="1.2em">Donor: ${truncateAddress(details.donorAddress)}</tspan>
        <tspan x="10" dy="1.2em">Amount: ${details.amount} ETH</tspan>
        <tspan x="10" dy="1.2em">Association: ${truncateAddress(details.associationAddress)}</tspan>
        <tspan x="10" dy="1.2em">Date: ${new Date(details.timestamp).toISOString().split('T')[0]}</tspan>
      </text>
    </svg>
    `;
  }

  function truncateAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  async function generateAndPinSBT(details: DonationDetails): Promise<string> {
    const svgImage = generateSVG(details);
    
    const options: PinataPinOptions = {
        pinataMetadata: {
          name: `DonorChain SBT Proof of Donation - Token ${details.tokenId}`,
        },
        pinataOptions: {
          cidVersion: 0, // TypeScript should now recognize this as 0 | 1 | undefined
        }
      };
  
    try {
      const imageResult = await pinata.pinJSONToIPFS({ image: svgImage }, options);
      
      const metadata = {
        description: "DonorChain SBT proof of donation",
        image: `ipfs://${imageResult.IpfsHash}`,
        name: `Proof of Donation - Token ${details.tokenId}`,
        attributes: [
          { trait_type: "Donor", value: details.donorAddress },
          { trait_type: "Amount", value: details.amount },
          { trait_type: "Association", value: details.associationAddress },
          { trait_type: "Timestamp", value: details.timestamp }
        ]
      };
  
      const jsonResult = await pinata.pinJSONToIPFS(metadata, options);
      
      return `ipfs://${jsonResult.IpfsHash}`;
    } catch (error) {
      console.error("Error pinning to IPFS:", error);
      throw error;
    }
  }

export async function POST(request: Request) {
  try {
    const details: DonationDetails = await request.json();
    const metadataUri = await generateAndPinSBT(details);
    return NextResponse.json({ metadataUri });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Error generating and pinning SBT' }, { status: 500 });
  }
}