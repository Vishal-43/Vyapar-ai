export const selectorData = {
  market: "Andheri",
  product: "Tomatoes",
  forecastRange: "Next 7 Days",
};

export const stockMetrics = {
  predictedDemand: 520,
  stockNeeded: 540,
  overstockRisk: 12,
  understockRisk: 8,
};

export const demandGraphData = [
  { day: "Mon", actual: 420, forecast: 450 },
  { day: "Tue", actual: 460, forecast: 480 },
  { day: "Wed", actual: 430, forecast: 470 },
  { day: "Thu", actual: 410, forecast: 460 },
  { day: "Fri", actual: 440, forecast: 490 },
];

export const impactData = {
  festival: [
    {
      title: "Diwali",
      subtitle: "In 5 days",
      delta: "+30%",
      positive: true,
    },
    {
      title: "Navratri",
      subtitle: "In 12 days",
      delta: "+15%",
      positive: false,
    },
  ],
  weather: [
    {
      title: "Rain Expected",
      subtitle: "Tomorrow",
      delta: "-5%",
      positive: true,
    },
    {
      title: "Heat Wave",
      subtitle: "In 3 days",
      delta: "-8%",
      positive: false,
    },
  ],
};

export const recommendationTable = [
  {
    product: "Tomatoes",
    current: 500,
    suggested: 540,
    buffer: 40,
    risk: "Low",
  },
    {
    product: "Potatoes",
    current: 900,
    suggested: 590,
    buffer: 48,
    risk: "High",
  },
    {
    product: "Carratoes",
    current: 900,
    suggested: 390,
    buffer: 89,
    risk: "Medium",
  },
];
