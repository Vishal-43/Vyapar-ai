import { MapPin } from "lucide-react";
import { useForecast } from "../../../context/ForecastContext";

const inputBase =
  "w-full h-12 rounded-xl px-4 text-sm transition-colors " +
  "bg-black border border-gray-300 " +
  "dark:bg-white/5 dark:border-white/10 " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export default function MarketSelector() {
  const { selection, setSelection, markets } = useForecast();

  const states = [...new Set(markets.map((m) => m.state))];

  const cities = [
    ...new Set(
      markets
        .filter((m) => m.state === selection.state)
        .map((m) => m.city)
    ),
  ];

  const filteredMarkets = markets.filter(
    (m) =>
      m.state === selection.state &&
      m.city === selection.city
  );

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-emerald-600" />
        <h3 className="font-medium">Market Configuration</h3>
      </div>

      <select
        className={inputBase}
        value={selection.state || ""}
        onChange={(e) =>
          setSelection({
            state: e.target.value,
            city: undefined,
            market: undefined,
          })
        }
      >
        <option value="">Select State</option>
        {states.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <select
        className={inputBase}
        disabled={!selection.state}
        value={selection.city || ""}
        onChange={(e) =>
          setSelection({
            city: e.target.value,
            market: undefined,
          })
        }
      >
        <option value="">Select City</option>
        {cities.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <select
        className={inputBase}
        disabled={!selection.city}
        value={selection.market || ""}
        onChange={(e) =>
          setSelection({
            market: e.target.value,
          })
        }
      >
        <option value="">Select Market</option>
        {filteredMarkets.map((m) => (
          <option key={m.id} value={m.name}>
            {m.name}
          </option>
        ))}
      </select>

      
       
    </div>
  );
}
