import { useNavigate } from "react-router-dom";
import { FiBarChart2, FiBox, FiTrendingUp, FiZap, FiStar, FiTruck, FiTarget, FiActivity, FiDollarSign } from "react-icons/fi";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  path: string;
  color: string;
}

const actions: QuickAction[] = [
  {
    icon: <FiBarChart2 className="w-6 h-6" />,
    label: "Product Analysis",
    description: "Analyze price trends and forecasts",
    path: "/dashboard/product-analysis",
    color: "bg-blue-500",
  },
  {
    icon: <FiBox className="w-6 h-6" />,
    label: "Inventory",
    description: "Manage stock levels",
    path: "/dashboard/inventory",
    color: "bg-emerald-500",
  },
  {
    icon: <FiTrendingUp className="w-6 h-6" />,
    label: "Insights",
    description: "AI-powered market insights",
    path: "/dashboard/insights",
    color: "bg-purple-500",
  },
  {
    icon: <FiTarget className="w-6 h-6" />,
    label: "Recommendations",
    description: "Buy/sell suggestions",
    path: "/dashboard/recommendations",
    color: "bg-amber-500",
  },
  {
    icon: <FiDollarSign className="w-6 h-6" />,
    label: "Selling Strategy",
    description: "Best time-to-sell advice",
    path: "/dashboard/selling-strategy",
    color: "bg-emerald-600",
  },
  {
    icon: <FiStar className="w-6 h-6" />,
    label: "Watchlist",
    description: "Track favorite commodities",
    path: "/dashboard/watchlist",
    color: "bg-cyan-500",
  },
  {
    icon: <FiTruck className="w-6 h-6" />,
    label: "Supply Chain",
    description: "Track shipments",
    path: "/dashboard/supply-chain",
    color: "bg-rose-500",
  },
  {
    icon: <FiZap className="w-6 h-6" />,
    label: "Alerts",
    description: "Price alerts & notifications",
    path: "/dashboard/buysell-alerts",
    color: "bg-orange-500",
  },
  {
    icon: <FiActivity className="w-6 h-6" />,
    label: "Model Accuracy",
    description: "View prediction performance",
    path: "/dashboard/model-accuracy",
    color: "bg-indigo-500",
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left"
          >
            <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {action.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
