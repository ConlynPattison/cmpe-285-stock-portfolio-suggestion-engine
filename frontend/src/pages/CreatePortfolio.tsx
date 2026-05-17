import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { usePortfolioStore } from "../store/portfolioStore";
import type {
  AssetAllocation,
  PortfolioResponse,
  SavedAllocation,
  SavedPortfolio,
  StrategyMetadata,
  StrategyName,
  TrendPoint,
} from "../types";

// TODO: replace the synthesized trend / share / current_price data below with
// data returned from the backend once FR-6 (live yfinance prices) and FR-7
// (historical 5-day replay) land. Until then we synthesize plausible-looking
// values from the stub backend's flat prices so the View page demo works.

const synthesizeShares = (allocation: AssetAllocation): SavedAllocation => {
  const purchase_price_usd = 100 + Math.random() * 200;
  const current_price_usd = purchase_price_usd * (0.97 + Math.random() * 0.07);
  return {
    ...allocation,
    purchase_price_usd: Number(purchase_price_usd.toFixed(2)),
    current_price_usd: Number(current_price_usd.toFixed(2)),
    shares: Number((allocation.allocation_usd / purchase_price_usd).toFixed(4)),
  };
};

const synthesizeTrend = (amount: number): TrendPoint[] => {
  const today = new Date();
  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (4 - index));
    const drift = 0.98 + Math.random() * 0.04;
    return {
      date: day.toISOString().slice(0, 10),
      total_value_usd: Number((amount * drift).toFixed(2)),
    };
  });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export function CreatePortfolio() {
  const navigate = useNavigate();
  const { addPortfolio } = usePortfolioStore();

  const [strategies, setStrategies] = useState<StrategyMetadata[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<StrategyName[]>([]);
  const [amount, setAmount] = useState(5000);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [portfolioName, setPortfolioName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/strategies")
      .then((response) => response.json())
      .then(setStrategies)
      .catch(() => setError("Could not load strategy metadata."));
  }, []);

  const canSave = useMemo(
    () => portfolio !== null && portfolioName.trim().length > 0,
    [portfolio, portfolioName],
  );

  const handleCheckbox = (strategy: StrategyName) => {
    setError(null);
    setSelectedStrategies((current) => {
      if (current.includes(strategy)) {
        return current.filter((item) => item !== strategy);
      }
      if (current.length >= 2) {
        return current;
      }
      return [...current, strategy];
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSavedConfirmation(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: amount, strategies: selectedStrategies }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || "Unable to create portfolio.");
      }

      const data: PortfolioResponse = await response.json();
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!portfolio || !portfolioName.trim()) return;

    // TODO: replace with POST /api/portfolios once backend FR-8 lands.
    const savedAllocations = portfolio.allocations.map(synthesizeShares);
    const savedPortfolio: SavedPortfolio = {
      id: `local_${Date.now()}`,
      name: portfolioName.trim(),
      created_at: new Date().toISOString(),
      amount_invested_usd: portfolio.total_allocation_usd,
      strategies: selectedStrategies,
      allocations: savedAllocations,
      current_value_usd: savedAllocations.reduce(
        (total, item) => total + item.shares * item.current_price_usd,
        0,
      ),
      trend: synthesizeTrend(portfolio.total_allocation_usd),
    };

    addPortfolio(savedPortfolio);
    setSavedConfirmation(savedPortfolio.name);
    setPortfolioName("");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Build a new portfolio
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Choose an investment amount and one or two strategies. The engine will sample
          assets from each strategy's pool and split your investment evenly across them.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Investment amount
            </label>
            <input
              type="number"
              min={5000}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            <p className="mt-2 text-sm text-slate-500">Minimum investment is $5,000.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Investment strategies</h2>
            <p className="mt-2 text-sm text-slate-500">Select up to two strategies.</p>
            <div className="mt-4 space-y-3">
              {strategies.map((strategy) => {
                const checked = selectedStrategies.includes(strategy.name);
                return (
                  <label
                    key={strategy.name}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCheckbox(strategy.name)}
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">{strategy.label}</div>
                      <div className="mt-1 text-sm text-slate-600">{strategy.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || selectedStrategies.length === 0}
            >
              {isLoading ? "Building portfolio…" : "Generate portfolio"}
            </button>
            {portfolio && (
              <span className="text-sm text-slate-500">
                Generated {portfolio.allocations.length} allocations.
              </span>
            )}
          </div>

          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>

        <aside className="space-y-6">
          {portfolio ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Suggested allocation</h2>
              <div className="mt-2 text-sm text-slate-500">
                Total invested:{" "}
                <span className="font-medium text-slate-900">
                  {formatCurrency(portfolio.total_allocation_usd)}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {portfolio.allocations.map((item) => (
                  <div
                    key={`${item.strategy}-${item.ticker}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{item.ticker}</div>
                        <div className="text-sm text-slate-500">{item.name}</div>
                      </div>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {item.strategy}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      {formatCurrency(item.allocation_usd)} · {(item.weight * 100).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="block text-sm font-medium text-slate-700">
                  Save this portfolio
                </label>
                <input
                  type="text"
                  value={portfolioName}
                  onChange={(event) => setPortfolioName(event.target.value)}
                  placeholder="e.g. My Aggressive Mix"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save portfolio
                  </button>
                  {savedConfirmation && (
                    <button
                      type="button"
                      onClick={() => navigate("/portfolios")}
                      className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
                    >
                      Saved as "{savedConfirmation}" — view it
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Saved portfolios live only in this browser session until backend
                  persistence is wired up.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Your generated allocation will appear here. Saved portfolios show up on the{" "}
              <span className="font-medium text-slate-700">View Portfolios</span> page.
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}
