export type InsightPriority = "high" | "medium" | "info";

export interface InsightItem {
  id: string;
  title: string;
  reason: string;
  priority: InsightPriority;
  confidence: number;
  timeHorizon: "Immediate" | "Upcoming" | "Long-term";
}

export const insightDummy: InsightItem[] = [
  {
    id: "i1",
    title: "Festival-driven demand surge expected",
    reason:
      "Upcoming Ganesh Chaturthi historically increases vegetable demand by 25–35% in Mumbai wholesale markets.",
    priority: "high",
    confidence: 91,
    timeHorizon: "Immediate",
  },
  {
    id: "i2",
    title: "Weather may suppress short-term sales",
    reason:
      "Moderate rainfall forecasted over the next 3 days typically reduces footfall in retail markets.",
    priority: "medium",
    confidence: 76,
    timeHorizon: "Upcoming",
  },
  {
    id: "i3",
    title: "Stable pricing trend detected",
    reason:
      "No abnormal price volatility observed in the last 14 days across selected products.",
    priority: "info",
    confidence: 84,
    timeHorizon: "Long-term",
  },
];
