import type { SavedPortfolio, TrendPoint } from "../types";

// TODO: REMOVE THIS FILE once backend FR-8 (save/load named portfolios) lands.
//
// These constants are placeholder data so the View Portfolios page can be
// designed and demoed without a working persistence layer. Once the backend
// exposes the saved-portfolio endpoints, replace imports of MOCK_PORTFOLIOS
// with `fetch('/api/portfolios')` and `fetch('/api/portfolios/{id}')` calls
// (see REQUIREMENTS.md FR-8 acceptance criteria).
//
// Trend data here is hand-tuned to look realistic on a chart, not derived
// from real prices. Day-0 is the oldest, day-4 is most recent.

const trendingUp = (start: number): TrendPoint[] => [
  { date: "2026-05-12", total_value_usd: start * 0.978 },
  { date: "2026-05-13", total_value_usd: start * 0.988 },
  { date: "2026-05-14", total_value_usd: start * 0.995 },
  { date: "2026-05-15", total_value_usd: start * 1.012 },
  { date: "2026-05-16", total_value_usd: start * 1.024 },
];

const trendingDown = (start: number): TrendPoint[] => [
  { date: "2026-05-12", total_value_usd: start * 1.018 },
  { date: "2026-05-13", total_value_usd: start * 1.006 },
  { date: "2026-05-14", total_value_usd: start * 0.997 },
  { date: "2026-05-15", total_value_usd: start * 0.984 },
  { date: "2026-05-16", total_value_usd: start * 0.972 },
];

const volatile = (start: number): TrendPoint[] => [
  { date: "2026-05-12", total_value_usd: start * 0.985 },
  { date: "2026-05-13", total_value_usd: start * 1.015 },
  { date: "2026-05-14", total_value_usd: start * 0.992 },
  { date: "2026-05-15", total_value_usd: start * 1.021 },
  { date: "2026-05-16", total_value_usd: start * 1.008 },
];

export const MOCK_PORTFOLIOS: SavedPortfolio[] = [
  {
    id: "p_001",
    name: "Steady Index Core",
    created_at: "2026-04-10T14:23:00Z",
    amount_invested_usd: 10000,
    strategies: ["index"],
    allocations: [
      {
        ticker: "VTI",
        name: "Vanguard Total Stock Market ETF",
        strategy: "index",
        allocation_usd: 3333.33,
        weight: 0.3333,
        shares: 13.42,
        purchase_price_usd: 248.42,
        current_price_usd: 254.36,
      },
      {
        ticker: "IXUS",
        name: "iShares Core MSCI Total International Stock ETF",
        strategy: "index",
        allocation_usd: 3333.33,
        weight: 0.3333,
        shares: 49.81,
        purchase_price_usd: 66.92,
        current_price_usd: 68.51,
      },
      {
        ticker: "AGG",
        name: "iShares Core U.S. Aggregate Bond ETF",
        strategy: "index",
        allocation_usd: 3333.34,
        weight: 0.3334,
        shares: 33.79,
        purchase_price_usd: 98.65,
        current_price_usd: 99.12,
      },
    ],
    current_value_usd: 10240,
    trend: trendingUp(10000),
  },
  {
    id: "p_002",
    name: "Aggressive Growth Bet",
    created_at: "2026-05-01T09:15:00Z",
    amount_invested_usd: 15000,
    strategies: ["growth"],
    allocations: [
      {
        ticker: "NVDA",
        name: "Nvidia",
        strategy: "growth",
        allocation_usd: 5000,
        weight: 0.3333,
        shares: 3.42,
        purchase_price_usd: 1461.99,
        current_price_usd: 1421.37,
      },
      {
        ticker: "CRWD",
        name: "CrowdStrike",
        strategy: "growth",
        allocation_usd: 5000,
        weight: 0.3333,
        shares: 12.71,
        purchase_price_usd: 393.39,
        current_price_usd: 382.50,
      },
      {
        ticker: "SNOW",
        name: "Snowflake",
        strategy: "growth",
        allocation_usd: 5000,
        weight: 0.3334,
        shares: 26.45,
        purchase_price_usd: 189.04,
        current_price_usd: 183.79,
      },
    ],
    current_value_usd: 14580,
    trend: trendingDown(15000),
  },
  {
    id: "p_003",
    name: "Ethical + Quality Blend",
    created_at: "2026-05-08T16:42:00Z",
    amount_invested_usd: 25000,
    strategies: ["ethical", "quality"],
    allocations: [
      {
        ticker: "NEE",
        name: "NextEra Energy",
        strategy: "ethical",
        allocation_usd: 4166.67,
        weight: 0.1667,
        shares: 51.42,
        purchase_price_usd: 81.04,
        current_price_usd: 82.31,
      },
      {
        ticker: "ESGV",
        name: "Vanguard ESG U.S. Stock ETF",
        strategy: "ethical",
        allocation_usd: 4166.67,
        weight: 0.1667,
        shares: 36.49,
        purchase_price_usd: 114.18,
        current_price_usd: 115.94,
      },
      {
        ticker: "ICLN",
        name: "iShares Global Clean Energy ETF",
        strategy: "ethical",
        allocation_usd: 4166.66,
        weight: 0.1666,
        shares: 297.62,
        purchase_price_usd: 14.00,
        current_price_usd: 13.78,
      },
      {
        ticker: "MSFT",
        name: "Microsoft",
        strategy: "quality",
        allocation_usd: 4166.67,
        weight: 0.1667,
        shares: 8.42,
        purchase_price_usd: 494.85,
        current_price_usd: 504.12,
      },
      {
        ticker: "V",
        name: "Visa",
        strategy: "quality",
        allocation_usd: 4166.67,
        weight: 0.1667,
        shares: 13.18,
        purchase_price_usd: 316.13,
        current_price_usd: 318.45,
      },
      {
        ticker: "ACN",
        name: "Accenture",
        strategy: "quality",
        allocation_usd: 4166.66,
        weight: 0.1666,
        shares: 12.74,
        purchase_price_usd: 327.06,
        current_price_usd: 329.92,
      },
    ],
    current_value_usd: 25180,
    trend: volatile(25000),
  },
  {
    id: "p_004",
    name: "Deep Value Play",
    created_at: "2026-05-14T11:08:00Z",
    amount_invested_usd: 8000,
    strategies: ["value"],
    allocations: [
      {
        ticker: "BRK.B",
        name: "Berkshire Hathaway",
        strategy: "value",
        allocation_usd: 2666.67,
        weight: 0.3333,
        shares: 6.42,
        purchase_price_usd: 415.21,
        current_price_usd: 421.84,
      },
      {
        ticker: "XOM",
        name: "Exxon Mobil",
        strategy: "value",
        allocation_usd: 2666.67,
        weight: 0.3333,
        shares: 24.31,
        purchase_price_usd: 109.69,
        current_price_usd: 111.42,
      },
      {
        ticker: "WFC",
        name: "Wells Fargo",
        strategy: "value",
        allocation_usd: 2666.66,
        weight: 0.3334,
        shares: 43.18,
        purchase_price_usd: 61.76,
        current_price_usd: 62.84,
      },
    ],
    current_value_usd: 8132,
    trend: trendingUp(8000),
  },
];
