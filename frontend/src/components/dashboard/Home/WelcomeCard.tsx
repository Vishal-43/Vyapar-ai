import { TrendingUp, MapPin, Package, Calendar } from "lucide-react";

export default function WelcomeCard() {
  return (
    <div
      className="
        glass-card 
        p-6 sm:p-7 lg:p-8 
        mb-6 sm:mb-7
        border border-gray-600/80
        rounded-xl
        bg-linear-to-br from-white/80 to-white/60
        transition-all duration-300
        hover:border-emerald-400/70
        hover:shadow-[0_16px_40px_rgba(16,185,129,0.14)]
      "
    >
      {}
      <div className="flex items-start gap-3 sm:gap-4 mb-5">
        <div className="mt-1">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-semibold  leading-tight">
            Demand Forecast Setup
          </h2>
          <p className="text-xs sm:text-sm mt-1 max-w-md">
            Configure inputs for accurate, localized AI-driven demand predictions.
          </p>
        </div>
      </div>

      {}
      <ul className="space-y-3 sm:space-y-4 text-sm sm:text-[0.95rem] ">
        <li className="flex items-start gap-3">
          <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 mt-0.5 text-emerald-600 shrink-0" />
          <span className="">
            Select your{" "}
            <span className="font-medium  ">market location</span>{" "}
            to factor in regional demand patterns and festivals.
          </span>
        </li>

        <li className="flex items-start gap-3 ">
          <Package className="w-4 h-4 sm:w-4.5 sm:h-4.5 mt-0.5 text-emerald-600 shrink-0" />
          <span>
            Choose a{" "}
            <span className="font-medium  ">product</span>{" "}
            to analyze category-specific trends.
          </span>
        </li>

        <li className="flex items-start gap-3">
          <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 mt-0.5 text-emerald-600 shrink-0" />
          <span>
            Pick a{" "}
            <span className="font-medium ">forecast range</span>{" "}
            to plan short-term or festival-driven inventory.
          </span>
        </li>
      </ul>
    </div>
  );
}
