import { useEffect, useMemo, useState } from "react";

import { TrendChart } from "../components/TrendChart";
import { usePortfolioStore } from "../store/portfolioStore";
import type { SavedAllocation, SavedPortfolio } from "../types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const percentChange = (current: number, base: number) =>
  base === 0 ? 0 : ((current - base) / base) * 100;

const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

function trendDirection(portfolio: SavedPortfolio): number {
  return percentChange(portfolio.current_value_usd, portfolio.amount_invested_usd);
}

interface PortfolioListItemProps {
  portfolio: SavedPortfolio;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function PortfolioListItem({ portfolio, isSelected, onSelect, onDelete }: PortfolioListItemProps) {
  const change = trendDirection(portfolio);
  const changeColor = change >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={[
          "group flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition",
          isSelected
            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold leading-tight">{portfolio.name}</span>
          <span className={isSelected ? "text-emerald-200" : changeColor + " text-sm font-medium"}>
            {formatPercent(change)}
          </span>
        </div>
        <div
          className={[
            "flex items-center justify-between text-xs",
            isSelected ? "text-slate-300" : "text-slate-500",
          ].join(" ")}
        >
          <span>Created {formatDate(portfolio.created_at)}</span>
          <span>{formatCurrency(portfolio.current_value_usd)}</span>
        </div>
        <div
          className={[
            "flex flex-wrap gap-1 pt-1 text-[10px] uppercase tracking-wide",
            isSelected ? "text-slate-300" : "text-slate-500",
          ].join(" ")}
        >
          {portfolio.strategies.map((strategy) => (
            <span
              key={strategy}
              className={[
                "rounded-full px-2 py-0.5",
                isSelected ? "bg-white/10" : "bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              {strategy}
            </span>
          ))}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className={[
              "ml-auto text-[10px] uppercase tracking-wide transition",
              isSelected
                ? "text-slate-300 hover:text-white"
                : "text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-600",
            ].join(" ")}
            aria-label={`Delete ${portfolio.name}`}
          >
            Delete
          </button>
        </div>
      </button>
    </li>
  );
}

interface AllocationRowProps {
  allocation: SavedAllocation;
}

function AllocationRow({ allocation }: AllocationRowProps) {
  const change = percentChange(allocation.current_price_usd, allocation.purchase_price_usd);
  const positionValue = allocation.shares * allocation.current_price_usd;
  const changeColor = change >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-2">
        <div className="font-semibold text-slate-900">{allocation.ticker}</div>
        <div className="text-xs text-slate-500">{allocation.name}</div>
      </td>
      <td className="py-3 pr-2 text-xs uppercase tracking-wide text-slate-500">
        {allocation.strategy}
      </td>
      <td className="py-3 pr-2 text-right text-sm text-slate-700">
        {allocation.shares.toFixed(2)}
      </td>
      <td className="py-3 pr-2 text-right text-sm text-slate-700">
        {formatCurrency(allocation.purchase_price_usd)}
      </td>
      <td className="py-3 pr-2 text-right text-sm text-slate-700">
        {formatCurrency(allocation.current_price_usd)}
      </td>
      <td className={`py-3 pr-2 text-right text-sm font-medium ${changeColor}`}>
        {formatPercent(change)}
      </td>
      <td className="py-3 text-right text-sm font-semibold text-slate-900">
        {formatCurrency(positionValue)}
      </td>
    </tr>
  );
}

interface PortfolioDetailProps {
  portfolio: SavedPortfolio;
}

function PortfolioDetail({ portfolio }: PortfolioDetailProps) {
  const change = trendDirection(portfolio);
  const changeColor = change >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Portfolio</div>
          <h2 className="text-2xl font-semibold text-slate-900">{portfolio.name}</h2>
          <div className="mt-1 text-sm text-slate-500">
            Created {formatDate(portfolio.created_at)} ·{" "}
            {portfolio.strategies.join(" + ")} ·{" "}
            {portfolio.allocations.length} positions
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-slate-500">Current value</div>
          <div className="text-2xl font-semibold text-slate-900">
            {formatCurrency(portfolio.current_value_usd)}
          </div>
          <div className={`text-sm font-medium ${changeColor}`}>
            {formatPercent(change)} vs. invested{" "}
            <span className="text-slate-400">({formatCurrency(portfolio.amount_invested_usd)})</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">5-day trend</h3>
          <span className="text-xs text-slate-500">Most recent trading days</span>
        </div>
        <TrendChart data={portfolio.trend} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Individual positions</h3>
        <div className="-mx-2 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2 font-medium">Ticker</th>
                <th className="py-2 pr-2 font-medium">Strategy</th>
                <th className="py-2 pr-2 text-right font-medium">Shares</th>
                <th className="py-2 pr-2 text-right font-medium">Buy</th>
                <th className="py-2 pr-2 text-right font-medium">Now</th>
                <th className="py-2 pr-2 text-right font-medium">Change</th>
                <th className="py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.allocations.map((allocation) => (
                <AllocationRow key={allocation.ticker} allocation={allocation} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ViewPortfolios() {
  const { portfolios, removePortfolio } = usePortfolioStore();
  const [selectedId, setSelectedId] = useState<string | null>(portfolios[0]?.id ?? null);

  const selected = useMemo(
    () => portfolios.find((portfolio) => portfolio.id === selectedId) ?? null,
    [portfolios, selectedId],
  );

  useEffect(() => {
    if (portfolios.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !portfolios.some((portfolio) => portfolio.id === selectedId)) {
      setSelectedId(portfolios[0].id);
    }
  }, [portfolios, selectedId]);

  const handleDelete = (id: string) => {
    if (confirm("Delete this portfolio? This cannot be undone in the current session.")) {
      removePortfolio(id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Saved portfolios
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Pick a portfolio on the {portfolios.length === 0 ? "left" : "left"} to see its 5-day trend
            and individual position performance.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {portfolios.length} {portfolios.length === 1 ? "portfolio" : "portfolios"}
        </span>
      </header>

      {portfolios.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No saved portfolios yet. Head over to{" "}
          <span className="font-medium text-slate-700">Create</span> to build one.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <aside>
            <ul className="space-y-2">
              {portfolios.map((portfolio) => (
                <PortfolioListItem
                  key={portfolio.id}
                  portfolio={portfolio}
                  isSelected={portfolio.id === selectedId}
                  onSelect={() => setSelectedId(portfolio.id)}
                  onDelete={() => handleDelete(portfolio.id)}
                />
              ))}
            </ul>
          </aside>
          <section>
            {selected ? (
              <PortfolioDetail portfolio={selected} />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                Select a portfolio to view its details.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
