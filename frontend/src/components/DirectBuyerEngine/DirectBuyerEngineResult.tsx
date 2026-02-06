import React from "react";
import { Link as LinkIcon, TrendingUp, Package, Award, CheckCircle } from 'lucide-react';

interface MatchResult {
  buyer_id: number;
  seller_id: number;
  commodity: string;
  quantity: number;
  match_score: number;
}

interface DirectBuyerEngineResultProps {
  results: MatchResult[];
  loading?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 70) return 'text-blue-600 dark:text-blue-400';
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-orange-600 dark:text-orange-400';
};

const getScoreBg = (score: number) => {
  if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 70) return 'bg-blue-100 dark:bg-blue-900/30';
  if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-orange-100 dark:bg-orange-900/30';
};

export const DirectBuyerEngineResult: React.FC<DirectBuyerEngineResultProps> = ({ results, loading }) => {
  if (loading) {
    return (
      <div className="glass-card rounded-xl shadow-lg p-12 border text-center" style={{ borderColor: "var(--border)" }}>
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color: "var(--text-soft)" }}>Finding optimal matches...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="rounded-lg p-12 text-center border" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
        <Package className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-soft)" }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-main)" }}>
          No Matches Found
        </h3>
        <p style={{ color: "var(--text-soft)" }}>
          Load sample data and click "Match Buyers & Sellers" to see results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">Total Matches Found</p>
            <h2 className="text-3xl font-bold">{results.length}</h2>
          </div>
        </div>
      </div>

      {/* Match Results */}
      <div className="glass-card rounded-xl shadow-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-purple-500" />
            Match Results
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "var(--panel)" }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-soft)" }}>
                  Buyer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-soft)" }}>
                  Seller ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-soft)" }}>
                  Commodity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-soft)" }}>
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-soft)" }}>
                  Match Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {results.map((result, idx) => (
                <tr key={idx} className="transition" style={{ cursor: "default" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
                        Buyer #{result.buyer_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded">
                        <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
                        Seller #{result.seller_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
                      {result.commodity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm" style={{ color: "var(--text-soft)" }}>
                      {result.quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(result.match_score)}`}>
                        <Award className={`w-4 h-4 mr-1 ${getScoreColor(result.match_score)}`} />
                        <span className={getScoreColor(result.match_score)}>
                          {result.match_score}%
                        </span>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
