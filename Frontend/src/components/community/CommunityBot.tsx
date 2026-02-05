import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Award } from 'lucide-react';

interface Insight {
  id: string;
  title: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

interface TrendingItem {
  name: string;
  change: number;
  sentiment: 'up' | 'down' | 'neutral';
}

interface CommunityBotProps {
  className?: string;
}

export const CommunityBot: React.FC<CommunityBotProps> = ({ className = '' }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInsights([
        {
          id: '1',
          title: 'Gold Rally Expected - Safe haven demand high',
          sentiment: 'bullish',
          confidence: 0.87,
        },
        {
          id: '2',
          title: 'Wheat Prices Under Pressure - Supply surplus',
          sentiment: 'bearish',
          confidence: 0.75,
        },
        {
          id: '3',
          title: 'Oil Consolidating - OPEC+ steady production',
          sentiment: 'neutral',
          confidence: 0.72,
        },
      ]);

      setTrending([
        { name: 'Gold', change: 2.5, sentiment: 'up' },
        { name: 'Crude Oil', change: -1.2, sentiment: 'down' },
        { name: 'Copper', change: 1.8, sentiment: 'up' },
        { name: 'Wheat', change: -0.9, sentiment: 'down' },
      ]);

      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const getSentimentBadge = (sentiment: 'bullish' | 'bearish' | 'neutral') => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'bearish':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-700 dark:to-blue-700 rounded-lg p-4 mb-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={20} />
          <h3 className="font-bold">Daily Insights Bot</h3>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Live Updates</span>
        </div>
      </div>

      {}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
          AI Predictions
        </h4>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${getSentimentBadge(insight.sentiment)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium leading-snug flex-1">{insight.title}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Award size={14} />
                    <span className="text-xs font-bold">{Math.round(insight.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-1">
          <TrendingUp size={16} /> Trending
        </h4>

        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {trending.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.name}
                </span>
                <span
                  className={`text-sm font-bold ${
                    item.sentiment === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : item.sentiment === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {item.change > 0 ? '+' : ''}
                  {item.change}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          AI-powered market analysis
        </p>
      </div>
    </div>
  );
};
