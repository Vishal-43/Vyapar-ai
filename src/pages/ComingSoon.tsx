import { Clock, Sparkles } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";

import GraphBackgroundCorner from "../components/Background/GraphBackgroundCorner";

export default function ComingSoon() {
  return (
    <>
    <div className="relative min-h-screen overflow-hidden">
      {}
      <Navbar />
      <GraphBackgroundCorner/>
        {}
        
      {}
      <div className="absolute inset-0 " />

      {}
      <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-emerald-400/10 blur-[120px]" />

      {}
      <main
        className="
          relative z-10
          flex items-center justify-center
          min-h-[calc(100vh-64px)]
          px-4
        "
      >
        <div
          className="
            glass-card
            max-w-lg
            w-full
            p-10
            sm:p-12
            text-center
            space-y-6
          "
        >
          {}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-500">
            <Clock className="h-7 w-7" />
          </div>

          {}
          <h1 className="text-2xl sm:text-3xl font-semibold ">
            Coming Soon
          </h1>

          {}
          <p className="text-sm sm:text-base  leading-relaxed">
            We’re actively building this feature to make your forecasting workflow
            faster, smarter, and more powerful.
          </p>

          {}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium
            bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            In active development
          </div>

          {}
          <div className="h-px w-full bg-gray-200 dark:bg-white/10" />

          {}
          <p className="text-xs">
            This section will unlock automatically once it’s ready.
          </p>
        </div>
      </main>

      {}
      <div className="z-9999">

      </div>
    </div>
      <DashFooter />
            </>
  );
}
