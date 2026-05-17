import { useEffect, useState } from "react";

import { TrendChart } from "../components/TrendChart";
import type { AllocationItem, PortfolioDetail, PortfolioSummary } from "../types";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const pctChange = (current: number, base: number) =>
  base === 0 ? 0 : ((current - base) / base) * 100;

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

interface PortfolioListItemProps {
  portfolio: PortfolioSummary;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function PortfolioListItem({ portfolio, isSelected, onSelect, onDelete }: PortfolioListItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={[
          "group relative flex w-full flex-col gap-1.5 rounded-2xl border px-4 py-3.5 text-left transition-all",
          isSelected
            ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold leading-tight">{portfolio.name}</span>
        </div>
        <div className={[
          "flex items-center justify-between text-xs",
          isSelected ? "text-indigo-100" : "text-slate-500",
        ].join(" ")}>
          <span>{formatDate(portfolio.created_at)}</span>
          <span className="font-medium">{fmt(portfolio.amount_usd)}</span>
        </div>
        <div className={[
          "flex flex-wrap gap-1 pt-0.5 text-[10px] uppercase tracking-wide",
          isSelected ? "text-indigo-100" : "text-slate-400",
        ].join(" ")}>
          {portfolio.strategies.map((s) => (
            <span key={s} className={[
              "rounded-full px-2 py-0.5",
              isSelected ? "bg-white/15" : "bg-slate-100",
            ].join(" ")}>{s}</span>
          ))}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={[
              "ml-auto transition-opacity",
              isSelected
                ? "text-indigo-200 hover:text-white"
                : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500",
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
  allocation: AllocationItem;
}

function AllocationRow({ allocation }: AllocationRowProps) {
  const change = pctChange(allocation.current_price, allocation.purchase_price);
  const positionValue = allocation.shares * allocation.current_price;
  const isUp = change >= 0;

  return (
    <tr className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
      <td className="py-3 pr-4">
        <div className="font-bold text-slate-900">{allocation.ticker}</div>
        <div className="text-xs text-slate-400 truncate max-w-[140px]">{allocation.name}</div>
      </td>
      <td className="py-3 pr-4">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {allocation.strategy}
        </span>
      </td>
      <td className="py-3 pr-4 text-right text-sm text-slate-600">
        {allocation.shares.toFixed(4)}
      </td>
      <td className="py-3 pr-4 text-right text-sm text-slate-600">
        {fmt(allocation.purchase_price)}
      </td>
      <td className="py-3 pr-4 text-right text-sm text-slate-700 font-medium">
        {fmt(allocation.current_price)}
      </td>
      <td className={[
        "py-3 pr-4 text-right text-sm font-semibold",
        isUp ? "text-emerald-600" : "text-rose-600",
      ].join(" ")}>
        <span className={[
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
          isUp ? "bg-emerald-50" : "bg-rose-50",
        ].join(" ")}>
          {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </span>
      </td>
      <td className="py-3 text-right text-sm font-bold text-slate-900">
        {fmt(positionValue)}
      </td>
    </tr>
  );
}

interface PortfolioDetailViewProps {
  portfolio: PortfolioDetail;
}

function PortfolioDetailView({ portfolio }: PortfolioDetailViewProps) {
  const change = pctChange(portfolio.current_value_usd, portfolio.amount_usd);
  const gainLoss = portfolio.current_value_usd - portfolio.amount_usd;
  const isUp = change >= 0;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header card */}
      <div className={[
        "relative overflow-hidden rounded-2xl border p-6 shadow-sm",
        isUp ? "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white" : "border-rose-100 bg-gradient-to-br from-rose-50 to-white",
      ].join(" ")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Portfolio</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{portfolio.name}</h2>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
              <span>Created {formatDate(portfolio.created_at)}</span>
              <span>·</span>
              <span>{portfolio.strategies.join(" + ")}</span>
              <span>·</span>
              <span>{portfolio.allocations.length} positions</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Live value</div>
            <div className="mt-1 text-3xl font-bold text-slate-900">
              {fmt(portfolio.current_value_usd)}
            </div>
            <div className={[
              "mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
              isUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
            ].join(" ")}>
              {isUp ? "▲" : "▼"} {fmtPct(Math.abs(change))}
              <span className="font-normal text-xs opacity-80">
                ({isUp ? "+" : ""}{fmt(gainLoss)}) vs {fmt(portfolio.amount_usd)} invested
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">5-day performance</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
            Most recent trading days
          </span>
        </div>
        <TrendChart data={portfolio.trend} />
      </div>

      {/* Positions table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Individual positions</h3>
          <p className="text-xs text-slate-400 mt-0.5">Live prices · {portfolio.allocations.length} holdings</p>
        </div>
        <div className="overflow-x-auto px-4">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-4">Asset</th>
                <th className="py-3 pr-4">Strategy</th>
                <th className="py-3 pr-4 text-right">Shares</th>
                <th className="py-3 pr-4 text-right">Cost basis</th>
                <th className="py-3 pr-4 text-right">Current</th>
                <th className="py-3 pr-4 text-right">Change</th>
                <th className="py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.allocations.map((a) => (
                <AllocationRow key={a.ticker} allocation={a} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-100 bg-slate-50/60">
                <td colSpan={6} className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 pl-1">
                  Total portfolio value
                </td>
                <td className="py-3 text-right text-sm font-bold text-slate-900">
                  {fmt(portfolio.current_value_usd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ViewPortfolios() {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portfolios")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: PortfolioSummary[]) => {
        setPortfolios(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => setListError("Could not load portfolios."))
      .finally(() => setIsLoadingList(false));
  }, []);

  useEffect(() => {
    if (selectedId === null) { setSelectedPortfolio(null); return; }
    setIsLoadingDetail(true);
    setDetailError(null);
    fetch(`/api/portfolios/${selectedId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: PortfolioDetail) => setSelectedPortfolio(data))
      .catch(() => setDetailError("Could not load details. The market may be closed — try again shortly."))
      .finally(() => setIsLoadingDetail(false));
  }, [selectedId]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this portfolio? This cannot be undone.")) return;
    await fetch(`/api/portfolios/${id}`, { method: "DELETE" });
    setPortfolios((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (selectedId === id) {
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
        if (remaining.length === 0) setSelectedPortfolio(null);
      }
      return remaining;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My portfolios</h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-lg">
            Live prices, 5-day trend, and position-level performance for each saved portfolio.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
          {portfolios.length} {portfolios.length === 1 ? "portfolio" : "portfolios"}
        </span>
      </div>

      {listError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v4M8 10.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {listError}
        </div>
      )}

      {isLoadingList ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <svg className="animate-spin text-indigo-500" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="28" strokeDashoffset="14" strokeLinecap="round"/></svg>
          <p className="text-sm text-slate-400">Loading your portfolios…</p>
        </div>
      ) : portfolios.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M4 24 L11 14 L18 18 L27 8" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p className="font-semibold text-slate-700">No portfolios yet</p>
            <p className="mt-1 text-sm text-slate-400">Head to <span className="font-medium text-indigo-600">Build Portfolio</span> to create your first one.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <aside>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 pl-1">
              Your portfolios
            </p>
            <ul className="space-y-2">
              {portfolios.map((p) => (
                <PortfolioListItem
                  key={p.id}
                  portfolio={p}
                  isSelected={p.id === selectedId}
                  onSelect={() => setSelectedId(p.id)}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </ul>
          </aside>

          <section>
            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                <svg className="animate-spin text-indigo-500" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="28" strokeDashoffset="14" strokeLinecap="round"/></svg>
                <p className="text-sm text-slate-400">Fetching live prices…</p>
              </div>
            ) : detailError ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
                <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6.5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {detailError}
              </div>
            ) : selectedPortfolio ? (
              <PortfolioDetailView portfolio={selectedPortfolio} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                <p className="text-sm text-slate-400">Select a portfolio on the left to view details.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

