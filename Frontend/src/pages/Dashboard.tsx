import { useEffect, useState } from "react";

import { DashboardLayout } from "../components/layout/DashboardLayout";
import { CardSkeleton } from "../components/common";

import { ForecastProvider } from "../context/ForecastContext";

import WelcomeCard from "../components/dashboard/Home/WelcomeCard";
import MarketSelector from "../components/dashboard/Home/MarketSelector";
import ProductSelector from "../components/dashboard/Home/ProductSelector";
import GenerateForecastCTA from "../components/dashboard/Home/GenerateForecastCTA";
import DashFooter from "../components/dashboard/Home/dashFooter";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-12 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ForecastProvider>
        {}
        <main className="relative z-10 max-w-2xl mx-auto mt-12">
          <WelcomeCard />

          <div className="grid gap-6">
            <MarketSelector />
            <ProductSelector />
            <GenerateForecastCTA />
          </div>
        </main>
      </ForecastProvider>
      <DashFooter/>
    </DashboardLayout>
  );
}
