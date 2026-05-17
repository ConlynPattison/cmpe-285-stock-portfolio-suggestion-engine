# Stock Portfolio Suggestion Engine — Requirements & Deliverables

## 1. Vision

A web app that takes an investment amount and one or two investment strategies, and returns a concrete portfolio of stocks/ETFs with a dollar allocation per holding, the live total value, and a 5-day historical value trend. Users can save and re-open named portfolios.

This document captures the scoped requirements, acceptance criteria, use cases, and a deliverables checklist. Items not listed in §6 Functional Requirements are out of MVP scope and either appear in §7 Stretch Goals or are explicitly not in scope.

## 2. Glossary

- **Strategy** — one of `ethical`, `growth`, `index`, `quality`, `value`.
- **Asset** — a single stock or ETF identified by ticker.
- **Allocation** — the dollar amount of the input investment assigned to a single asset.
- **Portfolio** — the full set of allocations produced for a request, plus its computed market value.
- **Snapshot** — a `(date, total_value)` pair stored for trend display.
- **Trend** — the rolling 5-trading-day series of portfolio total values.

## 3. Personas

- **Demo user** — non-technical visitor exploring the app, generates a portfolio once, looks at the chart, leaves.
- **Returning user** — saves a few named portfolios, comes back later to see how each has moved.
- **Grader / reviewer** — runs the project locally via `docker compose`, walks the checklist, hits each documented endpoint.

## 4. Architecture (target)

- **Backend**: FastAPI (Python 3.12), SQLAlchemy + SQLite, `yfinance` for live and historical prices, Pydantic v2 for schemas.
- **Frontend**: React 19 + TypeScript + Vite 6, Tailwind for styling, a chart library (e.g. Recharts) for the trend.
- **Containerization**: `docker compose` runs backend + frontend with hot reload; SQLite persisted via a named volume.
- **Persistence**: SQLite tables for saved portfolios, their allocations, and per-portfolio history snapshots. No auth — portfolios are global but named.

## 5. Constraints

- Python must be used for the backend (course requirement).
- Minimum investment is $5,000.
- A request selects 1 or 2 strategies.
- Each strategy must map to at least 3 stocks/ETFs.

## 6. Functional Requirements

Each requirement has an ID, a statement, and one or more acceptance criteria (AC). The deliverables checklist in §9 tracks these by ID.

### FR-1: Investment amount input
The user can enter a dollar amount in USD.
- **AC-1.1** The UI rejects amounts < $5,000 with an inline message before submit.
- **AC-1.2** The API returns HTTP 400 with a descriptive error if `amount_usd < 5000`.
- **AC-1.3** Non-numeric or negative inputs are rejected.

### FR-2: Strategy selection (1 or 2)
The user can select between 1 and 2 strategies from the five fixed options.
- **AC-2.1** The UI prevents selecting a 3rd strategy.
- **AC-2.2** Submitting 0 strategies is blocked client-side and rejected (HTTP 400) server-side.
- **AC-2.3** Each strategy is listed with its label and one-line description, fetched from `/api/strategies`.

### FR-3: Strategy → asset mapping
Each strategy maps to a pool of at least 3 stocks/ETFs. At request time, the engine samples `assets_per_strategy` (default 3) from each selected strategy's pool, uniformly at random without replacement, so repeated calls with the same input return different mixes.
- **AC-3.1** `backend/app/strategy_data.py` defines a pool of ≥3 distinct tickers per strategy. To make randomization meaningful, the shipped pools should each contain noticeably more than 3 entries (current pools all have ≥10).
- **AC-3.2** Each entry includes ticker, full name, asset type (`stock` or `etf`), and a one-line rationale.
- **AC-3.3** Two consecutive calls with the same `(amount_usd, strategies)` will, with high probability, return at least one different ticker.
- **AC-3.4** The selection routine accepts an optional injectable `random.Random` so tests can pin a seed for determinism.

### FR-4: Allocation output
The engine returns the list of selected assets per strategy.
- **AC-4.1** `POST /api/portfolio` returns an `allocations` array; each item carries `ticker`, `name`, `strategy`, `allocation_usd`, `weight`.
- **AC-4.2** When two strategies are selected, both contribute assets and the strategy is identifiable on each allocation.
- **AC-4.3** Total asset count = `assets_per_strategy × strategy_count` (default 3 per strategy → 3 or 6 assets).

### FR-5: Money division
The engine splits the input amount across selected assets.
- **AC-5.1** Default split is equal-weight across all selected assets.
- **AC-5.2** `sum(allocation_usd)` is within ±$0.05 of the input amount (rounding tolerance).
- **AC-5.3** `weight` values sum to 1.0 within float tolerance.

### FR-6: Live portfolio value
The portfolio's current total market value is shown using up-to-date prices.
- **AC-6.1** `POST /api/portfolio` calls a real market data source (`yfinance`) and computes `total_value = Σ shares × current_price`, where `shares = allocation_usd / purchase_price`.
- **AC-6.2** A tracked purchase price per holding is persisted with the portfolio so subsequent re-pricings are coherent.
- **AC-6.3** A `GET /api/portfolio/{id}/value` (or equivalent) re-prices an existing saved portfolio without recreating it.
- **AC-6.4** Price-fetch failures (network, unknown ticker) surface as a clear error and do not crash the request.

### FR-7: 5-day value trend
The portfolio's value is shown across the most recent 5 trading days, computed as a backward replay of the portfolio's current share counts.

Share counts are fixed at purchase time: `shares_per_ticker = allocation_usd / purchase_price`, where `purchase_price` is the live price at the moment of portfolio creation (frozen on save). The trend value for each historical day `D` is then `Σ shares_per_ticker × close_price_on_D`. This produces the "value of my actual holdings over the last week" view — *not* an as-if-bought-5-days-ago simulation.

- **AC-7.1** Backend pulls the last 5 trading-day closes per ticker via `yfinance` and computes the per-day portfolio value using the share counts derived at portfolio creation.
- **AC-7.2** For a brand-new portfolio, today's trend point equals the invested amount within rounding tolerance (since `Σ shares × today_price = Σ allocation_usd`). For a reopened saved portfolio, today's point reflects market movement since purchase and will generally differ from the invested amount.
- **AC-7.3** The trend is returned in chronological order and consumed by the frontend chart.
- **AC-7.4** The chart is rendered as a line chart with date on the x-axis and dollar value on the y-axis, labeled and legible.
- **AC-7.5** When fewer than 5 days are available (new ticker, holiday, recent IPO), the API returns however many days exist and the chart renders without crashing.
- **AC-7.6** The 5-day window is always anchored to the most recent trading day (from "now"), regardless of when the portfolio was originally created. A portfolio saved a month ago still shows the last 5 trading days, not the 5 days following its creation.

### FR-8: Save & load named portfolios
Portfolios can be saved with a user-chosen name and reopened later.
- **AC-8.1** `POST /api/portfolio` accepts an optional `name`; if present, the portfolio is persisted with its allocations and purchase prices.
- **AC-8.2** `GET /api/portfolios` lists saved portfolios (id, name, created_at, strategy mix, total invested).
- **AC-8.3** `GET /api/portfolios/{id}` returns the full portfolio including allocations, current value (re-priced), and trend.
- **AC-8.4** `DELETE /api/portfolios/{id}` removes a saved portfolio.
- **AC-8.5** Names are unique; a duplicate name returns HTTP 409.
- **AC-8.6** Frontend has a "Saved portfolios" panel that lists, opens, and deletes them.

### FR-9: Validation & error UX
The user sees actionable errors, never silent failures.
- **AC-9.1** All HTTP 4xx responses carry `{"detail": "..."}` and the frontend surfaces `detail` verbatim.
- **AC-9.2** Network or 5xx failures show a generic "Something went wrong" banner with a retry affordance.
- **AC-9.3** Loading states are shown while requests are in flight.

### FR-10: API surface
A documented, versioned REST API.
- **AC-10.1** OpenAPI docs available at `/docs` (FastAPI default).
- **AC-10.2** Endpoints: `GET /api/health`, `GET /api/strategies`, `POST /api/portfolio`, `GET /api/portfolios`, `GET /api/portfolios/{id}`, `DELETE /api/portfolios/{id}`.
- **AC-10.3** Response schemas are Pydantic models with named fields (no untyped dicts at boundaries).

## 7. Stretch Goals (out of MVP scope)

These are explicitly *not required* to ship, but listed so they can be picked up if time permits. None block §9.

- **S-1** Custom allocation weights (user-tunable per-asset percentage instead of equal-weight).
- **S-2** Sector / asset-type breakdown chart (pie or stacked bar).
- **S-3** Per-asset detail page with company info pulled from yfinance.
- **S-4** Portfolio comparison view (overlay 2+ saved portfolios on the trend chart).
- **S-5** Risk metrics (volatility, beta vs. S&P 500, Sharpe ratio).
- **S-6** Export portfolio to CSV.
- **S-7** Light/dark theme toggle.
- **S-8** User accounts / auth.
- **S-9** Longer trend windows (1M / 3M / 1Y toggle).
- **S-10** Background daily-snapshot job that grows the trend forward over real time.

## 8. Use Cases

### UC-1: Generate a portfolio (happy path)
1. User opens `/`, sees the form.
2. Enters `$10,000`, selects `growth` and `index`.
3. Clicks **Generate Portfolio**.
4. Backend returns 6 allocations (3 per strategy), current total value, 5-day trend.
5. UI shows the allocation cards, total invested, current value, and a line chart.

### UC-2: Save a named portfolio
1. After UC-1, the user types `"My Aggressive Mix"` in the name field and clicks **Save**.
2. Backend persists; the portfolio appears in the **Saved portfolios** list.

### UC-3: Reopen a saved portfolio
1. User clicks an entry in **Saved portfolios**.
2. Backend re-prices it from the persisted purchase prices and returns current value + refreshed trend.
3. UI shows the portfolio in the same layout as UC-1, but with updated numbers.

### UC-4: Delete a saved portfolio
1. User clicks the delete icon on a saved entry, confirms.
2. Entry disappears from the list; subsequent `GET /api/portfolios/{id}` returns 404.

### UC-5: Validation errors
- **UC-5a** Amount $1,000 → inline error "Minimum investment is $5,000," submit blocked.
- **UC-5b** No strategies selected → submit blocked with "Select 1 or 2 strategies."
- **UC-5c** Duplicate save name → toast "A portfolio named X already exists."

### UC-6: Network / market-data failure
1. `yfinance` is unreachable.
2. `POST /api/portfolio` returns 502 with `{"detail": "Could not fetch live prices, please try again."}`.
3. UI shows the error banner with a **Retry** button; no partial state is persisted.

## 9. Deliverables Checklist

Tick as completed. Each item refers back to its FR ID.

### Backend
- [x] FR-3: ≥3 assets per strategy in `strategy_data.py` *(10 per strategy)*
- [x] FR-4 / FR-5: `build_portfolio_allocation` returns equal-weight split with strategy attribution *(now with random sampling per FR-3 AC-3.3)*
- [ ] FR-6: `yfinance`-backed `price_fetcher` (replaces stub)
- [ ] FR-6: Purchase prices persisted with portfolio allocations
- [ ] FR-7: Historical close fetch + per-day portfolio value computation
- [ ] FR-8: `Portfolio` + `PortfolioAllocation` + `PortfolioHistory` SQLAlchemy models with relationships *(only `PortfolioHistory` exists; needs `Portfolio` + `PortfolioAllocation`)*
- [ ] FR-8: `GET /api/portfolios`, `GET /api/portfolios/{id}`, `DELETE /api/portfolios/{id}` endpoints
- [x] FR-1 / FR-2 / FR-9: Pydantic validation + `HTTPException` mapping in `main.py` *(amount ≥ 5000 via `Field`, 1–2 strategies via `conlist`, `ValueError` → 400)*
- [ ] FR-10: All endpoints typed; visible in `/docs` *(existing endpoints typed and visible; pending FR-8 endpoints not yet added)*

### Frontend
- [x] FR-1: Amount input with client-side `< 5000` block *(HTML5 `min={5000}` blocks submit; no inline error message yet)*
- [x] FR-2: Strategy checkboxes capped at 2
- [x] FR-4: Allocation cards showing ticker, name, strategy badge, $ and %
- [ ] FR-6: Current value displayed prominently, separate from invested amount *(View page shows it for mocked saved portfolios; Create page result only shows invested amount because backend stub returns no current value)*
- [x] FR-7: 5-day trend rendered as a labeled line chart (Recharts or equivalent) *(chart component built; data is mocked until backend FR-7 lands)*
- [x] FR-8: "Save" control + "Saved portfolios" list panel with open / delete *(in-session only via Context store; persistence pending backend FR-8)*
- [ ] FR-9: Inline validation errors, loading states, server error banner *(loading + server error done; no inline validation messages for amount/strategy yet)*

### Demo readiness
- [ ] All UC-1 through UC-5 demoable end-to-end without code edits *(UC-1 missing current value + real trend; UC-2/3/4 only in-session; UC-5c duplicate-name toast not implemented)*
- [ ] Reset path (delete volume / DB row) documented in README

## 10. Open Questions

Items to resolve before or during implementation:

- **OQ-1** Rate-limit / caching policy for `yfinance` if a grader hammers the API. Proposal: 60s in-process TTL cache keyed by `(ticker, date)`.

> Resolved:
> - "Purchase price" = live price at creation, frozen on save (see FR-6 AC-6.2).
> - Trend window always anchored to the most recent trading day (see FR-7 AC-7.6).
> - Asset selection within a strategy is a uniform random sample without replacement, with an injectable RNG for tests (see FR-3 AC-3.3 / AC-3.4).
