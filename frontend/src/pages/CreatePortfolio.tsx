import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { TrendChart } from "../components/TrendChart";
import type {
  AllocationItem,
  PortfolioResponse,
  StrategyMetadata,
  StrategyName,
} from "../types";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

const STRATEGY_ICONS: Record<string, string> = {
  "Aggressive Growth":   "📈",
  "Conservative Income": "🛡️",
  "ESG / Sustainable":   "🌱",
  "Real Estate":         "🏢",
  "Technology":          "💡",
};

export function CreatePortfolio() {
  const navigate = useNavigate();

  const [strategies, setStrategies] = useState<StrategyMetadata[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<StrategyName[]>([]);
  const [amount, setAmount] = useState(10000);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [portfolioName, setPortfolioName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/strategies")
      .then((r) => r.json())
      .then(setStrategies)
      .catch(() => setError("Could not load strategy metadata."));
  }, []);

  const canSave = useMemo(
    () => portfolio !== null && portfolioName.trim().length > 0 && !isSaving,
    [portfolio, portfolioName, isSaving],
  );

  const handleAmountChange = (value: number) => {
    setAmount(value);
    setAmountError(value < 5000 ? "Minimum investment is $5,000." : null);
  };

  const handleCheckbox = (strategy: StrategyName) => {
    setError(null);
    setSelectedStrategies((current) => {
      if (current.includes(strategy)) return current.filter((s) => s !== strategy);
      if (current.length >= 2) return current;
      return [...current, strategy];
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (amount < 5000) { setAmountError("Minimum investment is $5,000."); return; }
    if (selectedStrategies.length === 0) { setError("Please select at least 1 strategy."); return; }
    setError(null);
    setIsLoading(true);
    setPortfolio(null);
    setSavedConfirmation(null);

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
      setPortfolio(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!portfolio || !portfolioName.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: portfolioName.trim(),
          amount_usd: amount,
          strategies: selectedStrategies,
          allocations: portfolio.allocations.map((item: AllocationItem) => ({
            ticker: item.ticker,
            name: item.name,
            strategy: item.strategy,
            allocation_usd: item.allocation_usd,
            weight: item.weight,
            purchase_price: item.purchase_price,
          })),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || "Could not save portfolio.");
      }
      setSavedConfirmation(portfolioName.trim());
      setPortfolioName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const gainLoss = portfolio
    ? portfolio.current_value_usd - portfolio.total_allocation_usd
    : 0;
  const gainLossPct = portfolio
    ? ((gainLoss / portfolio.total_allocation_usd) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 px-8 py-10 text-white shadow-xl shadow-indigo-500/20">
        <div className="relative z-10 max-w-xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Live market data · Real-time pricing
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Build your portfolio</h1>
          <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
            Choose a strategy and investment amount. Folio will diversify across top assets,
            show you live prices and a 5-day performance trend.
          </p>
        </div>
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -right-4 h-48 w-48 rounded-full bg-violet-600/40" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* ── Left column ──────────────────────────────────────────── */}
        <section className="space-y-6">

          {/* Amount input */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Investment amount
            </label>
            <p className="mb-4 text-xs text-slate-400">Minimum $5,000 · up to $10,000,000</p>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 font-medium">
                $
              </span>
              <input
                type="number"
                min={5000}
                step={500}
                value={amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-4 text-lg font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            {amountError && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-rose-600">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {amountError}
              </p>
            )}
            {/* quick presets */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[5000, 10000, 25000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAmountChange(preset)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    amount === preset
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700",
                  ].join(" ")}
                >
                  {fmt(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy picker */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Investment strategy</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {selectedStrategies.length}/2 selected
              </span>
            </div>
            <p className="mb-4 text-xs text-slate-400">Select 1 or 2 strategies to blend.</p>
            <div className="space-y-2">
              {strategies.map((strategy) => {
                const checked = selectedStrategies.includes(strategy.name);
                const icon = STRATEGY_ICONS[strategy.label] ?? "📊";
                const disabled = !checked && selectedStrategies.length >= 2;
                return (
                  <button
                    key={strategy.name}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleCheckbox(strategy.name)}
                    className={[
                      "w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-150",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
                      checked
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-400 shadow-sm active:bg-indigo-100"
                        : disabled
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-40"
                        : "cursor-pointer border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 active:bg-indigo-50 active:border-indigo-400",
                    ].join(" ")}
                  >
                    <span className="mt-0.5 text-2xl leading-none select-none">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{strategy.label}</span>
                        {checked && (
                          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{strategy.description}</p>
                    </div>
                    {/* indicator */}
                    <div className={[
                      "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-150",
                      checked
                        ? "border-indigo-600 bg-indigo-600 scale-110"
                        : "border-slate-300 bg-white",
                    ].join(" ")}>
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || selectedStrategies.length === 0 || !!amountError}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-150 hover:bg-indigo-700 hover:shadow-indigo-700/30 active:scale-95 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeDasharray="20" strokeDashoffset="10"/></svg>
                  Fetching live prices…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10 L7 4 L11 7 L14 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 2h3v3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Generate portfolio
                </>
              )}
            </button>
            {selectedStrategies.length === 0 && !isLoading && (
              <p className="text-sm text-slate-400">Select a strategy to continue.</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v4M8 10.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}
        </section>

        {/* ── Right column ─────────────────────────────────────────── */}
        <aside className="space-y-5">
          {portfolio ? (
            <div className="animate-slide-up space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Invested</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{fmt(portfolio.total_allocation_usd)}</div>
                </div>
                <div className={[
                  "rounded-xl border p-4 shadow-sm",
                  gainLoss >= 0
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-rose-100 bg-rose-50",
                ].join(" ")}>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Live value</div>
                  <div className={[
                    "mt-1 text-xl font-bold",
                    gainLoss >= 0 ? "text-emerald-700" : "text-rose-700",
                  ].join(" ")}>{fmt(portfolio.current_value_usd)}</div>
                  <div className={[
                    "text-xs font-medium",
                    gainLoss >= 0 ? "text-emerald-600" : "text-rose-600",
                  ].join(" ")}>
                    {gainLoss >= 0 ? "▲" : "▼"} {pct(Math.abs(gainLossPct))}
                  </div>
                </div>
              </div>

              {/* Allocations */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">Suggested allocation</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{portfolio.allocations.length} positions · {portfolio.strategy_count} {portfolio.strategy_count === 1 ? "strategy" : "strategies"}</p>
                </div>
                <div className="divide-y divide-slate-50 px-5">
                  {portfolio.allocations.map((item) => (
                    <div key={`${item.strategy}-${item.ticker}`} className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.ticker}</span>
                            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              {item.strategy}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{item.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900">{fmt(item.allocation_usd)}</div>
                          <div className="text-xs text-slate-400">{(item.weight * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                      {/* weight bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                          style={{ width: `${(item.weight * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex gap-4 text-xs text-slate-400">
                        <span>{item.shares.toFixed(4)} shares</span>
                        <span>@ {fmt(item.purchase_price)}</span>
                        <span className={item.current_price >= item.purchase_price ? "text-emerald-600" : "text-rose-600"}>
                          now {fmt(item.current_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save section */}
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 rounded-b-2xl">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Save this portfolio
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={portfolioName}
                      onChange={(e) => setPortfolioName(e.target.value)}
                      placeholder="Give it a name…"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!canSave}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSaving ? (
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="white" strokeWidth="2" strokeDasharray="18" strokeDashoffset="9"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                      Save
                    </button>
                  </div>
                  {savedConfirmation && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2.5 2.5 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Saved as &ldquo;{savedConfirmation}&rdquo;
                      <button
                        type="button"
                        onClick={() => navigate("/portfolios")}
                        className="ml-auto font-semibold underline underline-offset-2 hover:text-emerald-800"
                      >
                        View →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Trend chart */}
              {portfolio.trend.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">5-day performance</h3>
                    <span className="text-xs text-slate-400">Most recent trading days</span>
                  </div>
                  <TrendChart data={portfolio.trend} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 20 L10 12 L16 15.5 L24 6" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="6" r="3" fill="#6366f1"/></svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Your allocation will appear here</p>
              <p className="text-xs text-slate-400 max-w-[180px]">
                Configure your strategy on the left and click Generate.
              </p>
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}

