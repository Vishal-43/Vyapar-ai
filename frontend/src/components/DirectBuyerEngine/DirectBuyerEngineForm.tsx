import React, { useState } from "react";
import { Users, UserPlus, Store, ShoppingCart, Link as LinkIcon } from 'lucide-react';

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
  loading?: boolean;
}

export const DirectBuyerEngineForm: React.FC<DirectBuyerEngineFormProps> = ({ onSubmit, loading }) => {
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);

  const addDummyData = () => {
    setBuyers([
      { id: 1, name: "Buyer 1", location: "City A", commodities: ["Wheat"], min_quantity: 10, max_quantity: 50, contact: "buyer1@example.com" },
      { id: 2, name: "Buyer 2", location: "City B", commodities: ["Rice"], min_quantity: 20, max_quantity: 100, contact: "buyer2@example.com" },
    ]);
    setSellers([
      { id: 1, name: "Seller 1", location: "City A", commodities: ["Wheat"], available_quantity: 40, contact: "seller1@example.com" },
      { id: 2, name: "Seller 2", location: "City B", commodities: ["Rice"], available_quantity: 75, contact: "seller2@example.com" },
    ]);
  };

  const canSubmit = buyers.length > 0 && sellers.length > 0 && !loading;

  return (
    <div className="glass-card rounded-xl shadow-lg p-6 border" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-6">
        <LinkIcon className="w-6 h-6 text-purple-500" />
        <h2 className="text-xl font-semibold">Matching Parameters</h2>
      </div>
      
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Buyers</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{buyers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Sellers</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{sellers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={addDummyData}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <UserPlus className="w-5 h-5" />
            Load Sample Data
          </button>

          <button
            onClick={() => onSubmit(buyers, sellers)}
            disabled={!canSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <LinkIcon className="w-5 h-5" />
                Match Buyers & Sellers
              </>
            )}
          </button>
        </div>

        {/* Data Preview */}
        {(buyers.length > 0 || sellers.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            {buyers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-soft)" }}>
                  <ShoppingCart className="w-4 h-4" />
                  Buyer Profiles
                </h3>
                <div className="space-y-2">
                  {buyers.map((buyer) => (
                    <div key={buyer.id} className="text-sm rounded p-2" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
                      <p className="font-medium" style={{ color: "var(--text-main)" }}>{buyer.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                        {buyer.location} • {buyer.commodities.join(', ')} • {buyer.min_quantity}-{buyer.max_quantity} qty
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sellers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-soft)" }}>
                  <Store className="w-4 h-4" />
                  Seller Profiles
                </h3>
                <div className="space-y-2">
                  {sellers.map((seller) => (
                    <div key={seller.id} className="text-sm rounded p-2" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
                      <p className="font-medium" style={{ color: "var(--text-main)" }}>{seller.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                        {seller.location} • {seller.commodities.join(', ')} • {seller.available_quantity} qty available
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
