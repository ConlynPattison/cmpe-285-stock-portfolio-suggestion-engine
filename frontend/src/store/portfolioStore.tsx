import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { MOCK_PORTFOLIOS } from "../data/mockPortfolios";
import type { SavedPortfolio } from "../types";

// TODO: REMOVE this in-memory store once backend FR-8 endpoints exist.
//
// For now, the store is seeded from MOCK_PORTFOLIOS and any portfolios
// "saved" during the session are appended in memory only — they are lost
// on refresh. This is intentional placeholder behavior so the Create →
// Save → View flow can be demoed without a working backend.

interface PortfolioStore {
  portfolios: SavedPortfolio[];
  addPortfolio: (portfolio: SavedPortfolio) => void;
  removePortfolio: (id: string) => void;
}

const PortfolioStoreContext = createContext<PortfolioStore | null>(null);

export function PortfolioStoreProvider({ children }: { children: ReactNode }) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>(MOCK_PORTFOLIOS);

  const addPortfolio = useCallback((portfolio: SavedPortfolio) => {
    setPortfolios((current) => [portfolio, ...current]);
  }, []);

  const removePortfolio = useCallback((id: string) => {
    setPortfolios((current) => current.filter((portfolio) => portfolio.id !== id));
  }, []);

  const value = useMemo(
    () => ({ portfolios, addPortfolio, removePortfolio }),
    [portfolios, addPortfolio, removePortfolio],
  );

  return <PortfolioStoreContext.Provider value={value}>{children}</PortfolioStoreContext.Provider>;
}

export function usePortfolioStore(): PortfolioStore {
  const context = useContext(PortfolioStoreContext);
  if (!context) {
    throw new Error("usePortfolioStore must be used within PortfolioStoreProvider");
  }
  return context;
}
