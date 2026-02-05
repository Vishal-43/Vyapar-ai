import React, { useState } from "react";
import { DirectBuyerEngineForm } from "../components/DirectBuyerEngine/DirectBuyerEngineForm";
import { DirectBuyerEngineResult } from "../components/DirectBuyerEngine/DirectBuyerEngineResult";

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

interface MatchResult {
  buyer_id: number;
  seller_id: number;
  commodity: string;
  quantity: number;
  match_score: number;
}

export default function DirectBuyerEnginePage() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (buyers: BuyerProfile[], sellers: SellerProfile[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/direct-buyer/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyers, sellers }),
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Direct Buyer Engine</h2>
      <DirectBuyerEngineForm onSubmit={handleSubmit} />
      {loading ? <div>Loading...</div> : <DirectBuyerEngineResult results={results} />}
    </div>
  );
}
