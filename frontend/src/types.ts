export type StrategyName = "ethical" | "growth" | "index" | "quality" | "value";

export interface StrategyMetadata {
  name: StrategyName;
  label: string;
  description: string;
}

export interface TrendPoint {
  date: string;
  total_value_usd: number;
}

/** Single holding returned by both the generate and detail endpoints. */
export interface AllocationItem {
  ticker: string;
  name: string;
  strategy: StrategyName;
  allocation_usd: number;
  weight: number;
  shares: number;
  purchase_price: number;
  current_price: number;
}

/** Response from POST /api/portfolio (generate, does not save). */
export interface PortfolioResponse {
  allocations: AllocationItem[];
  total_allocation_usd: number;
  current_value_usd: number;
  strategy_count: number;
  trend: TrendPoint[];
}

/** Summary item from GET /api/portfolios list. */
export interface PortfolioSummary {
  id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   ifo  id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   id:   idg;
  amount_usd: number;
  strategies: StrategyName[];
  created  created  creaal  created  created onItem[  created  created  creaal  er  created  crendPoint[];
}
