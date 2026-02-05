import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface RealtimeCommodity {
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

export interface RealtimeMarketAlert {
  id: string;
  type: 'price-alert' | 'volume-spike' | 'trend-change';
  commodity: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
}

interface RealtimeContextType {
  commodities: RealtimeCommodity[];
  alerts: RealtimeMarketAlert[];
  isConnected: boolean;
  lastUpdate: Date | null;
  connect: () => void;
  disconnect: () => void;
  clearAlerts: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: ReactNode;
  wsUrl?: string;
}

const generateMockPrice = (basePrice: number, volatility: number = 2): number => {
  const change = (Math.random() - 0.5) * volatility;
  return Math.round((basePrice + change) * 100) / 100;
};

const generateMockCommodity = (name: string, symbol: string, basePrice: number): RealtimeCommodity => {
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

const generateRandomAlert = (commodities: RealtimeCommodity[]): RealtimeMarketAlert | null => {
  if (commodities.length === 0) return null;

  const types: Array<'price-alert' | 'volume-spike' | 'trend-change'> = [
    'price-alert',
    'volume-spike',
    'trend-change',
  ];
  const severities: Array<'info' | 'warning' | 'critical'> = ['info', 'warning', 'critical'];

  const randomCommodity = commodities[Math.floor(Math.random() * commodities.length)];
  const randomType = types[Math.floor(Math.random() * types.length)];
  const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

  const messages: Record<string, Record<string, string>> = {
    'price-alert': {
      info: `${randomCommodity.name} price updated to $${randomCommodity.price.toFixed(2)}`,
      warning: `${randomCommodity.name} approaching resistance level`,
      critical: `${randomCommodity.name} price surge detected!`,
    },
    'volume-spike': {
      info: `Normal volume trading on ${randomCommodity.name}`,
      warning: `Volume spike detected on ${randomCommodity.name} (${randomCommodity.volume}K)`,
      critical: `Unusual volume surge on ${randomCommodity.name}!`,
    },
    'trend-change': {
      info: `${randomCommodity.name} maintaining trend`,
      warning: `${randomCommodity.name} trend reversal possible`,
      critical: `${randomCommodity.name} strong trend change detected!`,
    },
  };

  return {
    id: `${randomCommodity.symbol}-${Date.now()}`,
    type: randomType,
    commodity: randomCommodity.name,
    message: messages[randomType][randomSeverity],
    severity: randomSeverity,
    timestamp: new Date(),
  };
};

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children, wsUrl }) => {
  const [commodities, setCommodities] = useState<RealtimeCommodity[]>(() => [
    generateMockCommodity('Gold', 'XAU/USD', 2052.5),
    generateMockCommodity('Silver', 'XAG/USD', 24.3),
    generateMockCommodity('Crude Oil', 'WTI', 87.2),
    generateMockCommodity('Natural Gas', 'NG', 2.85),
    generateMockCommodity('Copper', 'CU', 4.05),
  ]);

  const [alerts, setAlerts] = useState<RealtimeMarketAlert[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());

  useEffect(() => {

    const priceUpdateInterval = setInterval(() => {
      setCommodities((prev) =>
        prev.map((commodity) => {
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

    const alertInterval = setInterval(() => {
      setCommodities((current) => {
        const alert = generateRandomAlert(current);
        if (alert) {
          setAlerts((prev) => [alert, ...prev].slice(0, 10));
        }
        return current;
      });
    }, 8000 + Math.random() * 4000);

    return () => {
      clearInterval(priceUpdateInterval);
      clearInterval(alertInterval);
    };
  }, [wsUrl]);

  const connect = () => {
    setIsConnected(true);
  };

  const disconnect = () => {
    setIsConnected(false);
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const value: RealtimeContextType = {
    commodities,
    alerts,
    isConnected,
    lastUpdate,
    connect,
    disconnect,
    clearAlerts,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeProvider;
