export interface DonationDetails {
    donorAddress: string;
    amount: string;
    associationAddress: string;
    tokenId: number;
    timestamp: number;
  }
  
  // Vous pouvez ajouter d'autres types liés à votre application ici
  export interface Association {
    id: string;
    name: string;
    address: string;
  }
  
  export interface Donor {
    address: string;
    totalDonated: string;
  }
  
  export interface DonationBadge {
    tier: 'Bronze' | 'Silver' | 'Gold';
    imageUrl: string;
  }
  
  // ... autres types si nécessaire