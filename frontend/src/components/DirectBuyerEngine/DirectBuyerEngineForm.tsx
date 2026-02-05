import React, { useState } from "react";

interface BuyerProfile {
  id: number;
  name: string;
  location: string;
  commodities: string[];
  min_quantity: number;
  max_quantity: number;
  contact?: string;
}

interface SellerProfile {
  id: number;
  name: string;
  location: string;
  commodities: string[];
  available_quantity: number;
  contact?: string;
}

interface DirectBuyerEngineFormProps {
  onSubmit: (buyers: BuyerProfile[], sellers: SellerProfile[]) => void;
}

export const DirectBuyerEngineForm: React.FC<DirectBuyerEngineFormProps> = ({ onSubmit }) => {
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);

  // For brevity, just allow adding dummy buyers/sellers
  const addDummyData = () => {
    setBuyers([
      { id: 1, name: "Buyer 1", location: "City A", commodities: ["Wheat"], min_quantity: 10, max_quantity: 50, contact: "buyer1@example.com" },
    ]);
    setSellers([
      { id: 1, name: "Seller 1", location: "City A", commodities: ["Wheat"], available_quantity: 40, contact: "seller1@example.com" },
    ]);
  };

  return (
    <div>
      <button onClick={addDummyData}>Add Dummy Data</button>
      <button onClick={() => onSubmit(buyers, sellers)} disabled={buyers.length === 0 || sellers.length === 0}>
        Match Buyers & Sellers
      </button>
      <div>
        <h4>Buyers: {buyers.length}</h4>
        <h4>Sellers: {sellers.length}</h4>
      </div>
    </div>
  );
};
