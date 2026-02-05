import { useState, useRef, useEffect } from "react";
import { FiMessageSquare, FiSend, FiX, FiMinimize2, FiMaximize2, FiLoader } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your Vypaar AI assistant. I can help you with:\n\n• Current commodity prices\n• Price predictions\n• Market recommendations\n• Inventory suggestions\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processQuery = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();
    
    try {
      // Check for price-related queries
      if (lowerQuery.includes("price") || lowerQuery.includes("cost") || lowerQuery.includes("rate")) {
        const commodities = ["potato", "onion", "tomato", "rice", "wheat"];
        const matchedCommodity = commodities.find(c => lowerQuery.includes(c));
        
        if (matchedCommodity) {
          // Use Azadpur (Delhi's largest market) for price queries
          const response = await fetch(`${BACKEND_URL}/api/price-history?commodity=${matchedCommodity.charAt(0).toUpperCase() + matchedCommodity.slice(1)}&market=Azadpur&days=7`);
          if (response.ok) {
            const data = await response.json();
            if (data.prices && data.prices.length > 0) {
              const latestPrice = data.prices[data.prices.length - 1].price;
              const firstPrice = data.prices[0].price;
              const changePercent = ((latestPrice - firstPrice) / firstPrice) * 100;
              const trend = changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'stable';
              return `📊 **${matchedCommodity.charAt(0).toUpperCase() + matchedCommodity.slice(1)} Price Update**\n\nCurrent price in Azadpur (Delhi): ₹${latestPrice.toFixed(2)}/quintal\n\nTrend: ${trend === 'up' ? '📈 Increasing' : trend === 'down' ? '📉 Decreasing' : '➡️ Stable'}\nChange: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}% over last 7 days\n\nData from ${data.count} records.`;
            }
          }
          return `I couldn't find current price data for ${matchedCommodity}. Please make sure the data has been scraped for this commodity.`;
        }
        
        // General price query
        const commoditiesRes = await fetch(`${BACKEND_URL}/api/commodities`);
        if (commoditiesRes.ok) {
          const commodities = await commoditiesRes.json();
          const names = commodities.slice(0, 5).map((c: any) => c.name).join(", ");
          return `I can help you with prices! Please specify which commodity you're interested in. Available commodities include: ${names}.\n\nExample: "What is the price of potato?"`;
        }
      }

      // Forecast/prediction queries
      if (lowerQuery.includes("forecast") || lowerQuery.includes("predict") || lowerQuery.includes("future")) {
        return `📈 **Price Forecast Information**\n\nTo get detailed price forecasts:\n\n1. Go to the **Dashboard**\n2. Select your commodity and market\n3. Click "Generate Forecast"\n\nOur AI model uses:\n• Historical price trends\n• Seasonal patterns\n• Weather impact analysis\n• Festival calendar data\n\nWould you like me to explain any specific aspect?`;
      }

      // Recommendation queries
      if (lowerQuery.includes("recommend") || lowerQuery.includes("suggest") || lowerQuery.includes("should i buy") || lowerQuery.includes("should i sell")) {
        const recRes = await fetch(`${BACKEND_URL}/api/recommendations?limit=3`);
        if (recRes.ok) {
          const recommendations = await recRes.json();
          if (recommendations.length > 0) {
            let response = "📋 **Current Recommendations**\n\n";
            recommendations.forEach((rec: any, idx: number) => {
              response += `${idx + 1}. **${rec.commodity_name}**: ${rec.recommendation_type}\n   Confidence: ${rec.confidence}\n   Reason: ${rec.reasoning.slice(0, 100)}...\n\n`;
            });
            return response;
          }
        }
        return "Visit the **Recommendations** page to see AI-powered buy/sell suggestions based on current market conditions.";
      }

      // Inventory queries
      if (lowerQuery.includes("inventory") || lowerQuery.includes("stock")) {
        return `📦 **Inventory Management Tips**\n\n• Monitor stock levels in the **Inventory** page\n• Set up alerts for low stock warnings\n• Use AI suggestions for optimal stock levels\n\nWould you like to:\n1. View current inventory status?\n2. Add new stock?\n3. Get restocking recommendations?`;
      }

      // Market queries
      if (lowerQuery.includes("market") || lowerQuery.includes("mandi")) {
        const marketsRes = await fetch(`${BACKEND_URL}/api/markets`);
        if (marketsRes.ok) {
          const markets = await marketsRes.json();
          const names = markets.slice(0, 5).map((m: any) => m.name).join(", ");
          return `🏪 **Available Markets**\n\n${names}\n\nSelect a market in the Dashboard to view prices and forecasts for that location.`;
        }
      }

      // Weather queries
      if (lowerQuery.includes("weather") || lowerQuery.includes("rain") || lowerQuery.includes("monsoon")) {
        return `🌤️ **Weather Impact Analysis**\n\nWeather conditions affect crop prices:\n\n• **Heavy Rain**: May delay harvests, increase prices\n• **Drought**: Reduces supply, increases prices\n• **Normal Weather**: Stable supply and prices\n\nOur AI models factor in weather forecasts when predicting prices. Check the **Product Analysis** page for detailed weather impact on specific commodities.`;
      }

      // Help/capabilities
      if (lowerQuery.includes("help") || lowerQuery.includes("what can you do") || lowerQuery.includes("capabilities")) {
        return `🤖 **Vypaar AI Assistant Capabilities**\n\n1. **Price Queries**: Ask about current prices\n   Example: "What is the price of potato?"\n\n2. **Forecasts**: Get prediction info\n   Example: "Forecast for tomato prices"\n\n3. **Recommendations**: Buy/sell suggestions\n   Example: "Should I buy onions?"\n\n4. **Inventory**: Stock management tips\n   Example: "How to manage inventory?"\n\n5. **Market Info**: Available markets\n   Example: "Which markets are available?"\n\nHow can I assist you today?`;
      }

      // Default response
      return `I understand you're asking about "${query}". I can help you with:\n\n• Commodity prices (e.g., "potato price")\n• Price forecasts\n• Buy/sell recommendations\n• Inventory management\n• Market information\n\nPlease try rephrasing your question or ask for "help" to see all my capabilities.`;

    } catch (error) {
      console.error("Error processing query:", error);
      return "I'm having trouble connecting to the backend. Please make sure the server is running and try again.";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await processQuery(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 flex items-center justify-center z-50"
      >
        <FiMessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 transition-all ${
        isMinimized ? "w-72 h-14" : "w-96 h-[500px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 rounded-t-2xl bg-emerald-600 text-white">
        <div className="flex items-center gap-2">
          <FiMessageSquare className="w-5 h-5" />
          <span className="font-semibold">Vypaar AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            {isMinimized ? <FiMaximize2 className="w-4 h-4" /> : <FiMinimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[380px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
                  <FiLoader className="w-5 h-5 animate-spin text-emerald-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about prices, forecasts..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
