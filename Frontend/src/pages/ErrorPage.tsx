import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import GraphBackgroundCorner from "../components/Background/GraphBackgroundCorner";

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  description?: string;
}

/**
 * Generic error page component.
 * Can be used for 404, 500, and other error scenarios.
 */
export default function ErrorPage({
  statusCode = 404,
  title = "Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved.",
}: ErrorPageProps) {
  const navigate = useNavigate();

  const getBackgroundColor = (code: number) => {
    if (code === 404) return "from-blue-500/10 to-purple-500/10";
    if (code === 500) return "from-red-500/10 to-orange-500/10";
    if (code === 403) return "from-yellow-500/10 to-red-500/10";
    return "from-gray-500/10 to-gray-600/10";
  };

  const getIcon = () => {
    return <AlertTriangle className="w-20 h-20 text-gray-600 dark:text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <GraphBackgroundCorner />
      <Navbar />

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-20">
        <div className={`bg-gradient-to-br ${getBackgroundColor(
            statusCode
          )} rounded-3xl border border-gray-200 dark:border-gray-800 p-12 max-w-2xl w-full text-center`}
        >
          <div className="mb-6 flex justify-center">{getIcon()}</div>

          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
            {statusCode}
          </h1>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>

            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Home
            </button>

            <button
              onClick={() => navigate("/dashboard/selector")}
              className="px-6 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>

      <DashFooter />
    </div>
  );
}
