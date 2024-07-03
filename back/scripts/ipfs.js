const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const key = process.env.PINATA_KEY;
const secret = process.env.PINATA_SECRET;
console.log("SECRET", secret);
console.log("KEY", key);
const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK(key, secret);

const jwt=process.env.PINATA_JWT;

function generateSVG(donorAddress, amount, associationAddress, tokenId, timestamp) {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <rect width="100%" height="100%" fill="white" stroke="blue" stroke-width="10"/>
        <text x="10" y="30" font-family="Arial" font-size="12" fill="black">
            <tspan x="10" dy="1.2em">Token ID: ${tokenId}</tspan>
            <tspan x="10" dy="1.2em">Donor: ${donorAddress}</tspan>
            <tspan x="10" dy="1.2em">Amount: ${amount} ETH</tspan>
            <tspan x="10" dy="1.2em">Association: ${associationAddress}</tspan>
            <tspan x="10" dy="1.2em">Date: ${new Date(timestamp).toISOString()}</tspan>
        </text>
    </svg>
    `;
}

async function generateAndPinSBT(donorAddress, amount, associationAddress, tokenId, timestamp) {
    const svgImage = generateSVG(donorAddress, amount, associationAddress, tokenId, timestamp);
    
    const options = {
        pinataMetadata: {
            name: `DonorChain SBT Proof of Donation - Token ${tokenId}`,
        },
        pinataOptions: {
            cidVersion: 0
        }
    };

    try {
        // Pin l'image SVG
        const imageResult = await pinata.pinJSONToIPFS({ image: svgImage }, options);
        
        // Préparer les métadonnées
        const metadata = {
            description: "DonorChain SBT proof of donation",
            image: `ipfs://${imageResult.IpfsHash}`,
            name: `Proof of Donation - Token ${tokenId}`,
            attributes: [
                {
                    trait_type: "Donor",
                    value: donorAddress
                },
                {
                    trait_type: "Amount",
                    value: amount.toString()
                },
                {
                    trait_type: "Association",
                    value: associationAddress
                },
                {
                    trait_type: "Timestamp",
                    value: timestamp.toString()
                }
            ]
        };

        // Pin les métadonnées
        const jsonResult = await pinata.pinJSONToIPFS(metadata, options);
        
        console.log(`Metadata CID: ${jsonResult.IpfsHash}`);
        return `ipfs://${jsonResult.IpfsHash}`;
    } catch (error) {
        console.error("Error pinning to IPFS:", error);
        throw error;
    }
}

// Exemple d'utilisation
generateAndPinSBT(
    "0x1234...5678",
    "1.0", // 1 ETH
    "0x9876...5432",
    1, // tokenId
    Date.now()
).then(metadataUri => {
    console.log("Metadata URI:", metadataUri);
}).catch(console.error);