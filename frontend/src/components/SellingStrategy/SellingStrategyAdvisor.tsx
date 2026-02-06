import { useEffect, useMemo, useState } from "react";
import { Calendar, IndianRupee, Leaf, Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import CardComponent from "../ui/CardComponent";
import { API_BASE } from "../../lib/api";

interface CommodityOption {
  id: number;
  name: string;
  category?: string;
}

interface MarketOption {
  id: number;
  name: string;
  state?: string;
  district?: string;
}

interface AlternativeWindow {
  month: number;
  month_name: string;
  days_from_now: number;
  expected_price: number;
  price_increase_percent: number;
  total_storage_cost: number;
  net_profit: number;
  risk_level: string;
  reason: string;
}

interface SellingRecommendation {
  strategy: string;
  recommended_action: string;
  reasoning: string;
  confidence_score: number;
  current_price: number;
  expected_price?: number;
  price_increase_percent?: number;
  current_revenue: number;
  expected_revenue?: number;
  storage_cost?: number;
  net_profit_gain?: number;
  days_to_wait?: number;
  recommended_sell_date?: string;
  peak_month?: number;
  peak_month_name?: string;
  price_volatility: number;
  risk_level: string;
  price_trend: string;
  alternative_windows: AlternativeWindow[];
  warnings: string[];
  tips: string[];
}

const formatINR = (value?: number) =>
  typeof value === "number"
    ? `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : "—";

const riskColor = (risk: string) => {
  switch (risk) {
    case "HIGH":
      return "text-red-600 bg-red-50 dark:bg-red-900/20";
    case "MEDIUM":
      return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    default:
      return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
  }
};

export default function SellingStrategyAdvisor() {
  const [commodities, setCommodities] = useState<CommodityOption[]>([]);
  const [markets, setMarkets] = useState<MarketOption[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number | "">("");
  const [selectedMarketId, setSelectedMarketId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<string>("10");
  const [currentPrice, setCurrentPrice] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<SellingRecommendation | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsFetching(true);
      try {
        const [commoditiesRes, marketsRes] = await Promise.all([
          fetch(`${API_BASE}/api/commodities`),
          fetch(`${API_BASE}/api/markets`),
        ]);

        if (!commoditiesRes.ok || !marketsRes.ok) {
          throw new Error("Failed to load commodities or markets");
        }

        const commoditiesData = await commoditiesRes.json();
        const marketsData = await marketsRes.json();
        setCommodities(commoditiesData || []);
        setMarkets(marketsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dropdown data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchOptions();
  }, []);

  const selectedCommodity = useMemo(
    () => commodities.find((c) => c.id === selectedCommodityId),
    [commodities, selectedCommodityId]
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setRecommendation(null);

    if (!selectedCommodityId || !currentPrice || !quantity) {
      setError("Please select commodity, quantity and current price.");
      return;
    }

    const payload = {
      commodity_id: selectedCommodityId,
      commodity_name: selectedCommodity?.name || "",
      quantity_quintals: Number(quantity),
      current_price: Number(currentPrice),
      market_id: selectedMarketId || null,
    };

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/selling-strategies/get-strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to generate selling strategy");
      }

      const data = await res.json();
      setRecommendation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate strategy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <CardComponent title="Smart Selling Strategy Advisor" icon={<TrendingUp className="w-5 h-5" />}>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-soft)" }}>Commodity</label>
              <select
                value={selectedCommodityId}
                onChange={(event) => setSelectedCommodityId(Number(event.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 transition-all"
                style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
              >
                <option value="">Select commodity</option>
                {commodities.map((commodity) => (
                  <option key={commodity.id} value={commodity.id}>
                    {commodity.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-soft)" }}>Market (optional)</label>
              <select
                value={selectedMarketId}
                onChange={(event) => setSelectedMarketId(event.target.value ? Number(event.target.value) : "")}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 transition-all"
                style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
              >
                <option value="">All markets</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-soft)" }}>Quantity (quintals)</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 transition-all"
                style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
                placeholder="e.g. 10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-soft)" }}>Current Price (per quintal)</label>
              <input
                type="number"
                min="1"
                value={currentPrice}
                onChange={(event) => setCurrentPrice(event.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 transition-all"
                style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
                placeholder="e.g. 2300"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || isFetching}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Leaf className="h-4 w-4" />}
              Generate Strategy
            </button>
            {isFetching && <span className="text-xs" style={{ color: "var(--text-soft)" }}>Loading commodities and markets...</span>}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </form>
      </CardComponent>

      {recommendation && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CardComponent title="Recommended Strategy" icon={<CheckCircle2 className="w-5 h-5" />}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-soft)" }}>Strategy</span>
                <span className="font-semibold" style={{ color: "var(--text-main)" }}>{recommendation.strategy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-soft)" }}>Confidence</span>
                <span className="font-semibold" style={{ color: "var(--text-main)" }}>
                  {(recommendation.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${riskColor(recommendation.risk_level)}`}>
                Risk: {recommendation.risk_level}
              </div>
              <p style={{ color: "var(--text-main)" }}>{recommendation.recommended_action}</p>
              <p style={{ color: "var(--text-soft)" }}>{recommendation.reasoning}</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-soft)" }}>
                <TrendingUp className="h-4 w-4" />
                Price trend: {recommendation.price_trend}
              </div>
            </div>
          </CardComponent>

          <CardComponent title="Financial Impact" icon={<IndianRupee className="w-5 h-5" />}>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: "var(--text-soft)" }}>Revenue if sold now</p>
                  <p className="font-semibold text-lg" style={{ color: "var(--text-main)" }}>{formatINR(recommendation.current_revenue)}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-soft)" }}>Expected revenue</p>
                  <p className="font-semibold text-lg" style={{ color: "var(--text-main)" }}>{formatINR(recommendation.expected_revenue)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: "var(--text-soft)" }}>Expected price</p>
                  <p className="font-semibold" style={{ color: "var(--text-main)" }}>{formatINR(recommendation.expected_price)}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-soft)" }}>Price increase</p>
                  <p className="font-semibold" style={{ color: "var(--text-main)" }}>{recommendation.price_increase_percent?.toFixed(1) ?? "—"}%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: "var(--text-soft)" }}>Storage cost</p>
                  <p className="font-semibold" style={{ color: "var(--text-main)" }}>{formatINR(recommendation.storage_cost)}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-soft)" }}>Net profit gain</p>
                  <p className="font-semibold" style={{ color: "var(--text-main)" }}>{formatINR(recommendation.net_profit_gain)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-soft)" }}>
                <Calendar className="h-4 w-4" />
                Recommended sell date: {recommendation.recommended_sell_date || "—"}
              </div>
            </div>
          </CardComponent>

          <CardComponent title="Alternative Selling Windows" icon={<Calendar className="w-5 h-5" />}>
            <div className="space-y-3">
              {recommendation.alternative_windows.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-soft)" }}>No alternative windows available for this commodity.</p>
              )}
              {recommendation.alternative_windows.map((window) => (
                <div
                  key={`${window.month}-${window.days_from_now}`}
                  className="rounded-lg border p-4 text-sm space-y-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold" style={{ color: "var(--text-main)" }}>{window.month_name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${riskColor(window.risk_level)}`}>
                      {window.risk_level}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-soft)" }}>{window.reason}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ color: "var(--text-soft)" }}>Expected price</p>
                      <p className="font-semibold" style={{ color: "var(--text-main)" }}>{formatINR(window.expected_price)}</p>
                    </div>
                    <div>
                      <p style={{ color: "var(--text-soft)" }}>Net profit</p>
                      <p className="font-semibold" style={{ color: "var(--text-main)" }}>{formatINR(window.net_profit)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardComponent>

          <CardComponent title="Warnings & Tips" icon={<AlertTriangle className="w-5 h-5" />}>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold" style={{ color: "var(--text-main)" }}>Warnings</p>
                <ul className="list-disc ml-5 space-y-1" style={{ color: "var(--text-soft)" }}>
                  {recommendation.warnings.length === 0 && <li>No warnings.</li>}
                  {recommendation.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-main)" }}>Tips</p>
                <ul className="list-disc ml-5 space-y-1" style={{ color: "var(--text-soft)" }}>
                  {recommendation.tips.length === 0 && <li>No tips.</li>}
                  {recommendation.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardComponent>
        </div>
      )}
    </div>
  );
}
