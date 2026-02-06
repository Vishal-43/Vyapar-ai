import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import CardComponent from "./CardComponent";

interface GraphDataPoint {
  day: string;
  forecast: number;
  actual?: number;
}

interface GraphComponentProps {
  title: string;
  data: GraphDataPoint[];
}

export default function GraphComponent({
  title,
  data,
}: GraphComponentProps) {
  const allValues = data.flatMap((d) => [d.forecast, d.actual]).filter((v): v is number => v !== undefined && v !== null);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  
  const range = maxValue - minValue;
  const padding = range > 0 ? range * 0.05 : 5;
  const yAxisMin = Math.floor(minValue - padding);
  const yAxisMax = Math.ceil(maxValue + padding);

  return (
    <CardComponent title={title}>
      <div className="h-64 sm:h-72 min-h-[256px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={256} minWidth={0}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            {}
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
            />

            {}
            <XAxis
              dataKey="day"
              tick={{
                fill: "var(--text-soft)",
                fontSize: 12,
              }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />

            {}
            <YAxis
              domain={[yAxisMin, yAxisMax]}
              tick={{
                fill: "var(--text-soft)",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            {}
            <Tooltip
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 0,
                color: "var(--text-main)",
                fontSize: 13,
              }}
              labelStyle={{
                color: "var(--text-soft)",
                marginBottom: 4,
              }}
            />

            {}
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: "var(--text-soft)",
              }}
            />

            {}
            <Line
              type="monotone"
              dataKey="actual"
              name="Past Sales"
              stroke="var(--text-soft)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: "var(--text-soft)", strokeWidth: 0 }}
              animationDuration={600}
            />

            {}
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke={`rgb(var(--emerald-main))`}
              strokeWidth={3}
              dot={{ r: 4, fill: `rgb(var(--emerald-main))`, strokeWidth: 0 }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: `rgb(var(--emerald-main))`,
                fill: "var(--bg-main)",
              }}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardComponent>
  );
}
