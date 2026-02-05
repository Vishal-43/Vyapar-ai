import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Clock } from 'lucide-react';

interface LiveCommodity {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: Date;
  trend: number[];
}

export interface RealTimeMonitorProps {
  commodities?: LiveCommodity[];
  isConnected?: boolean;
  onDataUpdate?: (data: LiveCommodity[]) => void;
  className?: string;
}

const generateMockPrice = (basePrice: number, volatility: number = 2): number => {
  const change = (Math.random() - 0.5) * volatility;
  return Math.round((basePrice + change) * 100) / 100;
};

const generateMockCommodity = (name: string, symbol: string, basePrice: number): LiveCommodity => {
  const trend = Array.from({ length: 10 }, () => generateMockPrice(basePrice, 1.5));
  const latestPrice = trend[trend.length - 1];
  const previousPrice = trend[0];
  const change = latestPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;

  return {
    id: symbol,
    name,
    symbol,
    price: latestPrice,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 500000) + 100000,
    high: Math.max(...trend) + 0.5,
    low: Math.min(...trend) - 0.5,
    timestamp: new Date(),
    trend,
  };
};

const mockCommoditiesData: Record<string, { name: string; symbol: string; basePrice: number }> = {
  gold: { name: 'Gold', symbol: 'XAU/USD', basePrice: 2052.5 },
  silver: { name: 'Silver', symbol: 'XAG/USD', basePrice: 24.3 },
  oil: { name: 'Crude Oil', symbol: 'WTI', basePrice: 87.2 },
  natural_gas: { name: 'Natural Gas', symbol: 'NG', basePrice: 2.85 },
  copper: { name: 'Copper', symbol: 'CU', basePrice: 4.05 },
};

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({
  commodities: propCommodities,
  isConnected: propIsConnected = true,
  onDataUpdate,
  className = '',
}) => {
  const [commodities, setCommodities] = useState<LiveCommodity[]>(() =>
    Object.values(mockCommoditiesData).map(({ name, symbol, basePrice }) =>
      generateMockCommodity(name, symbol, basePrice)
    )
  );
  const [isConnected] = useState(propIsConnected);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCommodities((prevCommodities) =>
        prevCommodities.map((commodity) => {
          const baseData = mockCommoditiesData[commodity.symbol.split('/')[0].toLowerCase()];
          if (!baseData) return commodity;

          const newPrice = generateMockPrice(commodity.price, 0.8);
          const change = newPrice - commodity.price;
          const changePercent = (change / commodity.price) * 100;

          const newTrend = [...commodity.trend.slice(1), newPrice];

          return {
            ...commodity,
            price: newPrice,
            change,
            changePercent,
            high: Math.max(commodity.high, newPrice),
            low: Math.min(commodity.low, newPrice),
            volume: Math.floor(Math.random() * 500000) + 100000,
            timestamp: new Date(),
            trend: newTrend,
          };
        })
      );
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (propCommodities) {
      setCommodities(propCommodities);
    }
  }, [propCommodities]);

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate(commodities);
    }
  }, [commodities, onDataUpdate]);

  const getMiniSparkline = (prices: number[]) => {
    if (prices.length < 2) return '';

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const height = 30;

    const points = prices
      .map((price, i) => {
        const x = (i / (prices.length - 1)) * 100;
        const y = ((max - price) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return points;
  };

  return (
    <div className={`w-full ${className}`}>
      {}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Live Market Data</h3>
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock size={14} />
          Updated {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {commodities.map((commodity) => {
          const isPositive = commodity.change >= 0;
          const sparklinePoints = getMiniSparkline(commodity.trend);

          return (
            <div
              key={commodity.id}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
            >
              {}
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  {commodity.symbol}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {commodity.name}
                </p>
              </div>

              {}
              <div className="mb-2">
                <div className="flex items-baseline justify-between gap-1 mb-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${commodity.price.toFixed(2)}
                  </span>
                  <div
                    className={`flex items-center gap-0.5 text-xs font-semibold ${
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {isPositive ? '+' : ''}
                    {commodity.changePercent.toFixed(2)}%
                  </div>
                </div>
                <p
                  className={`text-xs ${
                    isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}${commodity.change.toFixed(2)}
                </p>
              </div>

              {}
              {sparklinePoints && (
                <div className="mb-2 h-6 flex items-end">
                  <svg
                    className="w-full h-full"
                    viewBox={`0 0 100 30`}
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points={sparklinePoints}
                      fill="none"
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeWidth="1"
                    />
                    <polyline
                      points={sparklinePoints}
                      fill={isPositive ? '#d1fae5' : '#fee2e2'}
                      fillOpacity="0.3"
                    />
                  </svg>
                </div>
              )}

              {}
              <div className="space-y-1 text-xs border-t border-gray-300 dark:border-gray-600 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">High</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${commodity.high.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Low</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${commodity.low.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Vol</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {(commodity.volume / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {}
      <div className="mt-4 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-xs">
          <Zap size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {isConnected ? (
              <>
                <span className="font-semibold">Live Updates Active</span>
                <span className="text-gray-500 dark:text-gray-400"> • Updates every 3 seconds</span>
              </>
            ) : (
              <>
                <span className="font-semibold">Reconnecting...</span>
                <span className="text-gray-500 dark:text-gray-400"> • Attempting to connect</span>
              </>
            )}
          </span>
        </div>
      </div>

      {}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Data simulated for demonstration. Connect to WebSocket for real-time prices.
      </p>
    </div>
  );
};
