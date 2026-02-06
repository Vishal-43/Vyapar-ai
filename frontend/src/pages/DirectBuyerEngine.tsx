import React, { useState } from "react";
import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import GraphBackgroundCorner from "../components/Background/GraphBackgroundCorner";
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (buyers: BuyerProfile[], sellers: SellerProfile[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/direct-buyer/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyers, sellers }),
      });
      if (!res.ok) throw new Error('Failed to match buyers and sellers');
      const data = await res.json();
      setResults(data);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-purple-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-indigo-400/10 blur-[120px]" />

      <Navbar />
      <GraphBackgroundCorner />

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Direct Buyer Engine</h1>
          <p style={{ color: "var(--text-soft)" }}>
            Connect buyers and sellers directly by matching commodity needs with availability.
          </p>
        </header>

        <div className="space-y-6">
          <DirectBuyerEngineForm onSubmit={handleSubmit} loading={loading} />
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-medium">Error: {error}</p>
            </div>
          )}
          
          <DirectBuyerEngineResult results={results} loading={loading} />
        </div>
      </main>

      <DashFooter />
    </div>
  );
}
