import { DonationDetails } from '@/types';

export async function generateSBT(details: DonationDetails): Promise<string> {
  try {
    const response = await fetch('/api/generate-sbt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(details),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    return data.metadataUri;
  } catch (error) {
    console.error('Error generating SBT:', error);
    throw error;
  }
}