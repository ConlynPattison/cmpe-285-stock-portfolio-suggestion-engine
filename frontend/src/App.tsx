import { useEffect, useState } from "react";

type StrategyName = "ethical" | "growth" | "index" | "quality" | "value";

interface StrategyMetadata {
    name: StrategyName;
    label: string;
    description: string;
}

interface AssetAllocation {
    ticker: string;
    name: string;
    strategy: StrategyName;
    allocation_usd: number;
    weight: number;
}

interface PortfolioResponse {
    allocations: AssetAllocation[];
    total_allocation_usd: number;
    strategy_count: number;
}

interface HistoryItem {
    snapshot_date: string;
    total_value: number;
}

function App() {
    const [strategies, setStrategies] = useState<StrategyMetadata[]>([]);
    const [selectedStrategies, setSelectedStrategies] = useState<StrategyName[]>([]);
    const [amount, setAmount] = useState(5000);
    const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetch("/api/strategies")
            .then((response) => response.json())
            .then(setStrategies)
            .catch(() => setError("Could not load strategy metadata."));
    }, []);

    useEffect(() => {
        fetch("/api/portfolio/history")
            .then((response) => response.json())
            .then((data) => setHistory(data.history))
            .catch(() => {
                /* ignore history failures for now */
            });
    }, [portfolio]);

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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount_usd: amount, strategies: selectedStrategies }),
            });

            if (!response.ok) {
                const body = await response.json();
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

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
            <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-semibold text-slate-900">Portfolio Suggestion Engine</h1>
                    <p className="mt-2 text-slate-600">
                        Enter your investment amount and choose one or two strategies.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <label className="mb-2 block text-sm font-medium text-slate-700">Investment amount</label>
                            <input
                                type="number"
                                min={5000}
                                value={amount}
                                onChange={(event) => setAmount(Number(event.target.value))}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                            <p className="mt-2 text-sm text-slate-500">Minimum investment is $5,000.</p>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <h2 className="text-lg font-semibold text-slate-900">Investment strategies</h2>
                            <p className="mt-2 text-sm text-slate-500">Select up to two strategies.</p>
                            <div className="mt-4 space-y-4">
                                {strategies.map((strategy) => (
                                    <label key={strategy.name} className="flex cursor-pointer items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedStrategies.includes(strategy.name)}
                                            onChange={() => handleCheckbox(strategy.name)}
                                            className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-700 focus:ring-slate-400"
                                        />
                                        <div>
                                            <div className="font-semibold text-slate-900">{strategy.label}</div>
                                            <div className="mt-1 text-sm text-slate-600">{strategy.description}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isLoading}
                        >
                            {isLoading ? "Building portfolio…" : "Generate Portfolio"}
                        </button>

                        {error && <p className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <h2 className="mb-3 text-lg font-semibold text-slate-900">Portfolio history</h2>
                            {history.length === 0 ? (
                                <p className="text-sm text-slate-500">No history available yet.</p>
                            ) : (
                                <ul className="space-y-3 text-sm text-slate-700">
                                    {history.map((item) => (
                                        <li key={item.snapshot_date} className="rounded-2xl bg-white p-4 shadow-sm">
                                            <div className="font-medium">{item.snapshot_date}</div>
                                            <div className="mt-1 text-slate-600">Total value: ${item.total_value.toFixed(2)}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {portfolio && (
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                <h2 className="text-lg font-semibold text-slate-900">Latest allocation</h2>
                                <div className="mt-4 text-sm text-slate-700">
                                    <div className="mb-3 text-slate-900">Total invested: ${portfolio.total_allocation_usd.toFixed(2)}</div>
                                    <div className="grid gap-3">
                                        {portfolio.allocations.map((item) => (
                                            <div key={item.ticker} className="rounded-2xl bg-white p-4 shadow-sm">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{item.ticker}</div>
                                                        <div className="text-sm text-slate-500">{item.name}</div>
                                                    </div>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                                        {item.strategy}
                                                    </span>
                                                </div>
                                                <div className="mt-3 text-sm text-slate-600">
                                                    Allocation: ${item.allocation_usd.toFixed(2)} • Weight: {(item.weight * 100).toFixed(2)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </form>
            </div>
        </div>
    );
}

export default App;
