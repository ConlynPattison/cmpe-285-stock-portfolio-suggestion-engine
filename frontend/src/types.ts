export type StrategyName = "ethical" | "growth" | "index" | "quality" | "value";

export interface StrategyMetadata {
  name: StrategyName;
  label: string;
  description: string;
}

export interface AssetAllocation {
  ticker: string;
  name: string;
  strategy: StrategyName;
  allocation_usd: number;
  weight: number;
}

export interface PortfolioResponse {
  allocations: AssetAllocation[];
  total_allocation_usd: number;
  strategy_count: number;
}

export interface TrendPoint {
  date: string;
  total_value_usd: number;
}

export interface SavedAllocation extends AssetAllocation {
  shares: number;
  purchase_price_usd: number;
  current_price_usd: number;
}

export interface SavedPortfolio {
  id: string;
  name: string;
  created_at: string;
  amount_invested_usd: number;
  strategies: StrategyName[];
  allocations: SavedAllocation[];
  current_value_usd: number;
  trend: TrendPoint[];
}
