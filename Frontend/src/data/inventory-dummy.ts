import { type ProductCategory } from "./forecast-dummy";

export interface InventoryRow {
  market: string;
  category: ProductCategory;
  product: string;
  current: number;
  suggested: number;
  risk: "Low" | "Medium" | "High";
}

export const inventoryDummy: InventoryRow[] = [
  {
    market: "APMC Vashi",
    category: "Vegetables",
    product: "Tomato",
    current: 500,
    suggested: 540,
    risk: "Low",
  },
  {
    market: "APMC Vashi",
    category: "Vegetables",
    product: "Onion",
    current: 300,
    suggested: 420,
    risk: "High",
  },
  {
    market: "Dadar Market",
    category: "Fruits",
    product: "Apple",
    current: 200,
    suggested: 260,
    risk: "Medium",
  },
];
