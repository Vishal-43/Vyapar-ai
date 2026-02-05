export interface SelectorData {
  market: string;
  product: string;
  forecastRange: string;
}

export interface StockMetrics {
  predictedDemand: number;
  stockNeeded: number;
  overstockRisk: number;
  understockRisk: number;
}

export interface DemandGraphPoint {
  day: string;
  actual: number;
  forecast: number;
}

export interface ImpactItem {
  title: string;
  subtitle?: string;
  delta?: string;
  positive?: boolean;
}

export interface ImpactData {
  festival: ImpactItem[];
  weather: ImpactItem[];
}

export interface RecommendationRow {
  product: string;
  current: number;
  suggested: number;
  buffer: number;
  risk: string;
}

export interface AnalysisContextValue {
  selectorData: SelectorData;
  stockMetrics: StockMetrics;
  demandGraphData: DemandGraphPoint[];
  impactData: ImpactData;
  recommendationTable: RecommendationRow[];
}
