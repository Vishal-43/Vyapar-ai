

export type MarketType = "Wholesale" | "Retail" | "Local Mandi";

export type Market = {
  id: string;
  name: string;
  city: string;
  state: string;
  type: MarketType;
};

export type ProductCategory =
  | "Vegetables"
  | "Fruits"
  | "Grains"
  | "Pulses";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
};

export type ForecastRangeValue = "7" | "14";

export type ForecastRange = {
  label: string;
  value: ForecastRangeValue;
  description: string;
};

export const forecastDummy = {
  markets: [
    {
      id: "m1",
      name: "APMC Vashi",
      city: "Mumbai",
      state: "Maharashtra",
      type: "Wholesale",
    },
    {
      id: "m2",
      name: "Dadar Market",
      city: "Mumbai",
      state: "Maharashtra",
      type: "Retail",
    },
    {
      id: "m3",
      name: "Pune Mandi",
      city: "Pune",
      state: "Maharashtra",
      type: "Local Mandi",
    },
    {
      id: "m4",
      name: "Azadpur Mandi",
      city: "Delhi",
      state: "Delhi",
      type: "Wholesale",
    },
  ] satisfies Market[],

  products: [
    { id: "p1", name: "Tomato", category: "Vegetables" },
    { id: "p2", name: "Onion", category: "Vegetables" },
    { id: "p3", name: "Potato", category: "Vegetables" },
    { id: "p4", name: "Cauliflower", category: "Vegetables" },
    { id: "p5", name: "Apple", category: "Fruits" },
    { id: "p6", name: "Banana", category: "Fruits" },
    { id: "p7", name: "Orange", category: "Fruits" },
    { id: "p8", name: "Rice", category: "Grains" },
    { id: "p9", name: "Wheat", category: "Grains" },
    { id: "p10", name: "Toor Dal", category: "Pulses" },
    { id: "p11", name: "Chana Dal", category: "Pulses" },
  ] satisfies Product[],

  forecastRanges: [
    {
      label: "Next 7 Days",
      value: "7",
      description: "Short-term demand outlook",
    },
    {
      label: "Next 14 Days",
      value: "14",
      description: "Festival and trend-based forecast",
    },
  ] satisfies ForecastRange[],
};
