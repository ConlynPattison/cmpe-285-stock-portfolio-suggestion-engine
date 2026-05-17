# Folio — Stock Portfolio Suggestion Engine

A full-stack web application that suggests diversified stock/ETF portfolios based on investment strategies, backed by **live market data** from Yahoo Finance, with user authentication and persistent named portfolios.

**Backend:** FastAPI (Python) + SQLAlchemy + SQLite + yfinance  
**Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS (indigo palette)  
**Auth:** Browser-native SHA-256 password hashing (Web Crypto API), multi-user localStorage store

---

## Features

- **5 investment strategies** — Ethical, Growth, Index, Quality, Value — each with a pool of ≥10 stocks/ETFs. Each request randomly samples 3 per strategy so repeated calls yield different mixes.
- **Live market prices** via `yfinance` batch download with exponential-backoff retries and a 60-second in-process cache. Dot-notation tickers (e.g. `BRK-B`) fall back to individual `yf.Ticker().history()` fetches.
- **5-day portfolio trend** computed from frozen share counts × historical daily closes, displayed as an area chart with gain/loss auto-colouring.
- **Equal-weight allocation** across selected assets; `sum(allocation_usd)` matches input amount within ±$0.05.
- **Save and reload named portfolios** — portfolios are persisted to SQLite with purchase prices; reopening re-prices live. Duplicate names return HTTP 409.
- **User authentication** — sign up / sign in flow with financial-grade password requirements (≥10 chars, uppercase, lowercase, digit, special char, no spaces). Passwords hashed with SHA-256 before storage.
- **Protected routes** — all app pages require sign-in; unauthenticated visitors are redirected to `/login`.
- **OpenAPI docs** at `http://localhost:8000/docs`.

---

## Project structure

```
cmpe-285-stock-portfolio-suggestion-engine/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI routes
│   │   ├── models.py          # SQLAlchemy ORM models
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── strategy_data.py   # Strategy pools (≥10 tickers each)
│   │   ├── portfolio_builder.py  # Equal-weight allocation logic
│   │   ├── price_fetcher.py   # yfinance wrapper with retry + cache
│   │   └── db.py              # SQLite session factory
│   ├── requirements.txt
│   └── .venv/
├── frontend/
│   └── src/
│       ├── context/
│       │   └── AuthContext.tsx      # Auth state, SHA-256 hashing, password rules
│       ├── components/
│       │   ├── Layout.tsx           # App shell with nav, user avatar, sign-out
│       │   ├── ProtectedRoute.tsx   # Auth guard
│       │   └── TrendChart.tsx       # Recharts AreaChart with auto gain/loss colours
│       └── pages/
│           ├── Login.tsx            # Dark glassmorphism sign-in page
│           ├── Signup.tsx           # Sign-up with live password strength meter
│           ├── CreatePortfolio.tsx  # Main portfolio creation form
│           └── ViewPortfolios.tsx   # Saved portfolio list + detail view
├── start.sh                   # Convenience script to start both services
└── REQUIREMENTS.md            # Full functional requirements and deliverables checklist
```

---

## Quick start (no Docker required)

### Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Python | 3.12 | `python3 --version` |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |

> **macOS tip:** Install Python 3.12 via [python.org](https://www.python.org/downloads/) or `brew install python@3.12`. Install Node via [nodejs.org](https://nodejs.org/) or `brew install node`.

---

### Option A — one-command start (recommended)

From the repo root:

```bash
cd cmpe-285-stock-portfolio-suggestion-engine
bash start.sh
```

`start.sh` will:
1. Create a Python virtual environment in `backend/.venv` if one doesn't exist
2. Install all Python dependencies (`fastapi`, `uvicorn`, `sqlalchemy`, `yfinance`, etc.)
3. Start the FastAPI backend on **http://localhost:8000**
4. Run `npm install` in `frontend/` if needed
5. Start the Vite dev server on **http://localhost:5173**

Press `Ctrl+C` once to stop both servers cleanly.

---

### Option B — manual start (two terminals)

**Terminal 1 — backend:**

```bash
cd cmpe-285-stock-portfolio-suggestion-engine/backend

# Create and activate the virtual environment (first time only)
python3.12 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Create the data directory and start the server
mkdir -p data
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**Terminal 2 — frontend:**

```bash
cd cmpe-285-stock-portfolio-suggestion-engine/frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
```

---

### Using the app

1. Open **http://localhost:5173** in your browser.
2. Click **Create one** on the login page to register a new account.
3. Enter a password that meets all 6 requirements shown in the live strength meter.
4. Once signed in, enter an investment amount (minimum **$5,000**) and select 1 or 2 strategies.
5. Click **Generate Portfolio** — live prices are fetched from Yahoo Finance and a 5-day trend chart is shown.
6. Optionally give your portfolio a name and click **Save Portfolio** to persist it.
7. Visit the **Portfolios** page to reopen, re-price, or delete saved portfolios.

API docs (Swagger UI): **http://localhost:8000/docs**

---

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Address already in use` on port 8000 | Run `lsof -ti:8000 \| xargs kill -9` then restart |
| `Address already in use` on port 5173 | Run `lsof -ti:5173 \| xargs kill -9` then restart |
| `No module named 'yfinance'` | Make sure you activated `.venv` and ran `pip install -r requirements.txt` |
| `npm: command not found` | Install Node.js from https://nodejs.org |
| Price fetch error for a ticker | Yahoo Finance may be rate-limiting; wait 60 seconds and retry |
| Blank page after login | Hard-refresh with `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux) |

---

### Reset / clean state

Wipe all saved portfolios (database is re-created automatically on next backend start):
```bash
rm cmpe-285-stock-portfolio-suggestion-engine/backend/data/portfolio.db
```

Reset frontend auth accounts (stored in browser `localStorage`):
1. Open browser DevTools → **Application** → **Local Storage** → `http://localhost:5173`
2. Delete the keys `folio_users` and `folio_session`

---

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/strategies` | List all 5 strategies with labels and descriptions |
| `POST` | `/api/portfolio` | Generate a portfolio (live prices + 5-day trend, does not save) |
| `POST` | `/api/portfolios` | Save a named portfolio |
| `GET` | `/api/portfolios` | List all saved portfolios |
| `GET` | `/api/portfolios/{id}` | Get a saved portfolio (re-priced live + refreshed trend) |
| `DELETE` | `/api/portfolios/{id}` | Delete a saved portfolio |
| `GET` | `/api/portfolio/history` | Last 5 daily value snapshots |

Full interactive docs: **http://localhost:8000/docs**

---

## Investment strategies

| Strategy | Focus |
|----------|-------|
| Ethical | ESG / socially responsible companies and ETFs |
| Growth | High-growth technology and innovation leaders |
| Index | Broad-market passive ETFs |
| Quality | Financially strong, profitable, low-debt companies |
| Value | Undervalued blue chips with strong fundamentals |

Each strategy pool contains ≥10 tickers. Three are sampled at random per request, so the same input produces different results on each call (randomization is injectable for tests).

---

## Password requirements (financial-grade)

Enforced identically on both client (live strength meter) and server (AuthContext):

1. At least 10 characters
2. At least one uppercase letter (A–Z)
3. At least one lowercase letter (a–z)
4. At least one number (0–9)
5. At least one special character (`!@#$%^&*` etc.)
6. No spaces

---

## Notes

- SQLite is used to minimise VM overhead; no external database required.
- The frontend proxies `/api` to `http://localhost:8000` via Vite's `server.proxy` config.
- `yfinance` batch downloads occasionally drop dot-notation tickers. `BRK.B` is stored as `BRK-B` (Yahoo Finance hyphen format); any ticker missing from a batch is retried individually.
- Price data is cached in-process for 60 seconds to avoid rate-limiting during rapid iteration.
- This is an educational project — it is not financial advice.

---

## Test Cases

**Test Case 1: Minimum Investment Amount Validation**
* **Objective:** Ensure the system rejects investment amounts below the $5,000 USD minimum.
* **Steps:** 
    1. Navigate to the "Build your portfolio" home page.
    2. In the "Investment amount" input field, type `4500`.
    3. Observe the error message below the input field and check the "Generate portfolio" button.
* **Expected Result:** A red error message "Minimum investment is $5,000." appears, and the "Generate portfolio" button becomes disabled.

**Test Case 2: Empty Strategy Selection Validation**
* **Objective:** Ensure the engine requires at least one investment strategy to proceed.
* **Steps:**
    1. Enter a valid amount (e.g., `10000`) into the "Investment amount" field.
    2. Ensure that **no** strategies are selected in the strategy list.
    3. Look at the "Generate portfolio" button.
* **Expected Result:** The button is disabled, and a message stating "Select a strategy to continue." is visible next to it. 

**Test Case 3: Single Strategy Portfolio Generation (Asset Count & Allocation)**
* **Objective:** Verify that selecting a single strategy returns at least 3 distinct stocks/ETFs and the money is divided evenly.
* **Steps:**
    1. Enter `9000` as the investment amount.
    2. Select the **Ethical Investing** strategy.
    3. Click "Generate portfolio".
* **Expected Result:** The right-hand column populates with exactly 3 different assets (e.g., NextEra Energy, Enphase Energy, etc.). The $9,000 should be divided equally, allocating $3,000 to each of the 3 assets (equating to 33.3% weight each).

**Test Case 4: Two-Strategy Blended Portfolio Generation**
* **Objective:** Verify that the engine correctly blends two strategies.
* **Steps:**
    1. Enter `12000` as the investment amount.
    2. Select the **Index Investing** and **Value Investing** strategies.
    3. Click "Generate portfolio".
* **Expected Result:** The generated portfolio contains exactly 6 assets (3 from Index Investing, 3 from Value Investing). The $12,000 is split evenly, allocating $2,000 per asset.

**Test Case 5: Exceeding Strategy Selection Limit**
* **Objective:** Ensure the system prevents a user from picking more than two strategies at a time.
* **Steps:**
    1. Select **Quality Investing**.
    2. Select **Growth Investing**.
    3. Attempt to click on a third strategy, like **Ethical Investing**.
* **Expected Result:** The third strategy (and any other unselected strategies) becomes greyed out and cannot be clicked. The UI will explicitly display "2/2 selected".

**Test Case 6: Real-Time Up-to-the-Second Market Values**
* **Objective:** Verify that the application is fetching current stock market prices from the internet.
* **Steps:**
    1. Generate a portfolio with $10,000 and the **Growth Investing** strategy.
    2. Look at the right-hand panel under the "Suggested allocation" list.
    3. Check the text below the progress bars that says something like "X shares @ $Y now $Z".
* **Expected Result:** The "$Z" value reflects live market data. Because the engine fetches current prices at the time of generation, the "Live value" box at the top right will display the total current value of the portfolio. 

**Test Case 7: 5-Day Historical Portfolio Trend Chart**
* **Objective:** Ensure the engine provides a visual weekly trend (5 days history) of the overall portfolio value.
* **Steps:**
    1. Generate a valid portfolio using any strategy.
    2. Scroll down on the right-hand panel to the "5-day performance" section.
* **Expected Result:** A line/bar chart is rendered containing exactly 5 data points. These points represent the total value of your specific stock allocation over the last 5 trading days.

**Test Case 8: Saving a Portfolio**
* **Objective:** Verify that users can save a generated portfolio to the database for later viewing.
* **Steps:**
    1. Generate a portfolio.
    2. Scroll to the "Save this portfolio" section below the stock list.
    3. Enter the name `Test Grader Portfolio` into the text box.
    4. Click the "Save" button.
* **Expected Result:** A green success message appears stating "Saved as Test Grader Portfolio", along with a link to "View →".

**Test Case 9: Viewing the Saved Portfolios List**
* **Objective:** Verify that the "View Portfolios" page correctly lists all user-saved portfolios.
* **Steps:**
    1. Click the "View →" link from the previous step, or navigate to `http://localhost:5173/portfolios`.
    2. Look for `Test Grader Portfolio` in the list of cards.
* **Expected Result:** The portfolio is listed with its correct initial investment amount and the tags of the strategies used to generate it.

**Test Case 10: Reloading a Saved Portfolio with Updated Live Values**
* **Objective:** Ensure that loading a previously saved portfolio recalculates its total value based on real-time prices while maintaining the original share allocation.
* **Steps:**
    1. On the `http://localhost:5173/portfolios` page, click on `Test Grader Portfolio`.
    2. Observe the loaded portfolio details.
* **Expected Result:** The original stock picks and share counts are exactly the same as when it was saved. However, the system performs a fresh API request so the "Live value" box and current individual asset prices reflect the most up-to-date market data.
