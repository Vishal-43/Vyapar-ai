import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

import { ErrorBoundary } from "./components/common/ErrorBoundary";
import AuthComponent from "./components/auth/AuthComponent";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import ProductAnalysis from "./pages/ProductAnalysis";
import ComingSoon from "./pages/ComingSoon";
import Inventory from "./pages/Inventory";
import Insights from "./pages/Insights";
import ModelAccuracy from "./pages/ModelAccuracy";
import BuySellAlerts from "./pages/BuySellAlerts";
import Docs from "./pages/Docs";
import DataImport from "./pages/DataImport";
import UserSettings from "./pages/UserSettings";
import Recommendations from "./pages/Recommendations";
import Community from "./pages/Community";
import Watchlist from "./pages/Watchlist";
import SupplyChain from "./pages/SupplyChain";
import ErrorPage from "./pages/ErrorPage";
import AIChatbot from "./components/AIChatbot/AIChatbot";
import { DataImportProvider } from "./context/DataImportContext";
import { UserSettingsProvider } from "./context/UserSettingsContext";
import { RecommendationProvider } from "./context/RecommendationContext";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {}
        <Route path="/auth" element={<AuthComponent />} />

        {}
        <Route
          path="/dashboard/selector"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>

              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          }
        />
        <Route path="/" element={<Landing />} />
        <Route 
          path="/dashboard/product-analysis" 
          element={
            <>
              <SignedIn>
                <ProductAnalysis />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          } 
        />
        <Route 
          path="/dashboard/inventory" 
          element={
            <>
              <SignedIn>
                <Inventory />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          } 
        />
        <Route 
          path="/dashboard/insights" 
          element={
            <>
              <SignedIn>
                <Insights />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          } 
        />
        <Route 
          path="/dashboard/model-accuracy" 
          element={
            <>
              <SignedIn>
                <ModelAccuracy />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          } 
        />
        <Route 
          path="/dashboard/buysell-alerts" 
          element={
            <>
              <SignedIn>
                <BuySellAlerts />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          } 
        />
        <Route 
          path="/dashboard/recommendations" 
          element={
            <>
              <SignedIn>
                <RecommendationProvider>
                  <Recommendations />
                </RecommendationProvider>
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          } 
        />
        <Route
          path="/dashboard/community"
          element={
            <>
              <SignedIn>
                <Community />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/dashboard/watchlist"
          element={
            <>
              <SignedIn>
                <Watchlist />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/dashboard/supply-chain"
          element={
            <>
              <SignedIn>
                <SupplyChain />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/dashboard/discussions"
          element={
            <>
              <SignedIn>
                <Community />
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          }
        />
        <Route 
          path="/data/import" 
          element={
            <>
              <SignedIn>
                <DataImportProvider>
                  <DataImport />
                </DataImportProvider>
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          } 
        />
        <Route 
          path="/dashboard/settings" 
          element={
            <>
              <SignedIn>
                <UserSettingsProvider>
                  <UserSettings />
                </UserSettingsProvider>
              </SignedIn>
              <SignedOut>
                <Navigate to="/auth" replace />
              </SignedOut>
            </>
          } 
        />
        <Route path="/blog" element={<ComingSoon />} />
        <Route path="/pricing" element={<ComingSoon />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/about" element={<ComingSoon />} />
        <Route path="/contact" element={<ComingSoon />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage statusCode={404} />} />

      </Routes>
      
      {/* Global AI Chatbot - appears on all pages */}
      <SignedIn>
        <AIChatbot />
      </SignedIn>
    </BrowserRouter>
  </ErrorBoundary>
  );
}
export default App;
