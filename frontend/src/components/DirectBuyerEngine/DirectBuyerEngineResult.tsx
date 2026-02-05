import React from "react";

interface MatchResult {
  buyer_id: number;
  seller_id: number;
  commodity: string;
  quantity: number;
  match_score: number;
}

interface DirectBuyerEngineResultProps {
  results: MatchResult[];
}

export const DirectBuyerEngineResult: React.FC<DirectBuyerEngineResultProps> = ({ results }) => {
  if (!results || results.length === 0) return <div>No matches found.</div>;
  return (
    <div>
      <h3>Match Results</h3>
      <table>
        <thead>
          <tr>
            <th>Buyer ID</th>
            <th>Seller ID</th>
            <th>Commodity</th>
            <th>Quantity</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td>{r.buyer_id}</td>
              <td>{r.seller_id}</td>
              <td>{r.commodity}</td>
              <td>{r.quantity}</td>
              <td>{r.match_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
