from contextlib import asynccontextmanager
from datetime import date
from typing import Dict, List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import get_session, init_db
from .models import Portfolio, PortfolioAllocation, PortfolioHistory
from .portfolio_builder import build_portfolio_allocation
from .price_fetcher import fetch_current_prices, fetch_historical_prices
from .schemas import (
    HistoryItem,
    PortfolioHistoryResponse,
    PortfolioRequest,
    PortfolioResponse,
    SavedPortfolioDetail,
    SavedPortfolioSummary,
    SavePortfolioRequest,
    StrategyMetadata,
)
from .strategy_data import STRATEGY_METADATA


def _compute_trend(
    shares_map: Dict[str, float], history: Dict[str, List[dict]]
) -> List[dict]:
    """Return a chronological 5-day trend list from share counts and historical closes."""
    if not shares_map or not history:
        return []

    price_maps = {
        ticker: {e["date"]: e["close"] for e in entries}
        for ticker, entries in history.items()
        if entries
    }
    if not price_maps:
        return []

    ticker_date_sets = [set(pm.keys()) for pm in price_maps.values()]
    common_dates = sorted(set.intersection(*ticker_date_sets))[-5:]

    if not common_dates:
        common_dates = sorted(set.union(*ticker_date_sets))[-5:]

    trend = []
    for d in common_dates:
        day_value = sum(
            shares_map[t] * price_maps[t][d]
            for t in shares_map
            if t in price_maps and d in price_maps[t]
        )
        if day_value > 0:
            trend.append({"date": d, "total_value_usd": round(day_value, 2)})

    return trend


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Stock Portfolio Suggestion Engine",
    description="Suggests a portfolio allocation based on selected investment strategy(ies).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/strategies", response_model=List[StrategyMetadata])
def list_strategies():
    return [
        {
            "name": strategy,
            "label": metadata["label"],
            "description": metadata["description"],
        }
        for strategy, metadata in STRATEGY_METADATA.items()
    ]


@app.post("/api/portfolio", response_model=PortfolioResponse)
def create_portfolio(request: PortfolioRequest, session: Session = Depends(get_session)):
    """Generate a portfolio allocation with live prices and 5-day trend (does not save)."""
    try:
        allocations = build_portfolio_allocation(request.amount_usd, request.strategies)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not allocations:
        raise HTTPException(status_code=400, detail="Could not build a portfolio allocation.")

    tickers = [item["ticker"] for item in allocations]

    try:
        prices = fetch_current_prices(tickers)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    shares_map = {
        item["ticker"]: item["allocation_usd"] / prices[item["ticker"]]
        for item in allocations
    }

    current_value = round(sum(shares_map[t] * prices[t] for t in tickers), 2)

    history = fetch_historical_prices(tickers)
    trend = _compute_trend(shares_map, history)

    snapshot_date = date.today().isoformat()
    existing = session.query(PortfolioHistory).filter_by(snapshot_date=snapshot_date).first()
    if existing:
        existing.total_value = current_value
    else:
        session.add(PortfolioHistory(snapshot_date=snapshot_date, total_value=current_value))
    session.commit()

    return {
        "allocations": [
            {
                **item,
                "shares": round(shares_map[item["ticker"]], 6),
                "purchase_price": prices[item["ticker"]],
                "current_price": prices[item["ticker"]],
            }
            for item in allocations
        ],
        "total_allocation_usd": round(sum(item["allocation_usd"] for item in allocations), 2),
        "current_value_usd": current_value,
        "strategy_count": len(request.strategies),
        "trend": trend,
    }


@app.post("/api/portfolios", response_model=SavedPortfolioSummary, status_code=201)
def save_portfolio(request: SavePortfolioRequest, session: Session = Depends(get_session)):
    """Persist a named portfolio from a pre-computed allocation."""
    if session.query(Portfolio).filter_by(name=request.name).first():
        raise HTTPException(
            status_code=409,
            detail=f"A portfolio named '{request.name}' already exists.",
        )

    portfolio = Portfolio(
        name=request.name,
        amount_usd=request.amount_usd,
        strategies=",".join(request.strategies),
    )
    session.add(portfolio)
    session.flush()

    for item in request.allocations:
        session.add(
            PortfolioAllocation(
                portfolio_id=portfolio.id,
                ticker=item.ticker,
                name=item.name,
                strategy=item.strategy,
                allocation_usd=item.allocation_usd,
                weight=item.weight,
                purchase_price=item.purchase_price,
            )
        )

    session.commit()
    session.refresh(portfolio)

    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "amount_usd": portfolio.amount_usd,
        "strategies": portfolio.strategies.split(","),
        "created_at": portfolio.created_at,
    }


@app.get("/api/portfolio/history", response_model=PortfolioHistoryResponse)
def portfolio_history(session: Session = Depends(get_session)):
    rows = (
        session.query(PortfolioHistory)
        .order_by(PortfolioHistory.snapshot_date.desc())
        .limit(5)
        .all()
    )
    return {
        "history": [
            {"snapshot_date": row.snapshot_date, "total_value": round(row.total_value, 2)}
            for row in reversed(rows)
        ]
    }


@app.get("/api/portfolios", response_model=List[SavedPortfolioSummary])
def list_portfolios(session: Session = Depends(get_session)):
    portfolios = session.query(Portfolio).order_by(Portfolio.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "amount_usd": p.amount_usd,
            "strategies": p.strategies.split(","),
            "created_at": p.created_at,
        }
        for p in portfolios
    ]


@app.get("/api/portfolios/{portfolio_id}", response_model=SavedPortfolioDetail)
def get_portfolio(portfolio_id: int, session: Session = Depends(get_session)):
    portfolio = session.get(Portfolio, portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")

    tickers = [a.ticker for a in portfolio.allocations]
    if not tickers:
        raise HTTPException(status_code=422, detail="Portfolio has no allocations.")

    try:
        prices = fetch_current_prices(tickers)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    shares_map = {
        a.ticker: a.allocation_usd / a.purchase_price
        for a in portfolio.allocations
        if a.purchase_price and a.purchase_price > 0
    }

    current_value = round(
        sum(shares_map.get(a.ticker, 0) * prices.get(a.ticker, 0) for a in portfolio.allocations),
        2,
    )

    history = fetch_historical_prices(tickers)
    trend = _compute_trend(shares_map, history)

    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "amount_usd": portfolio.amount_usd,
        "strategies": portfolio.strategies.split(","),
        "created_at": portfolio.created_at,
        "allocations": [
            {
                "ticker": a.ticker,
                "name": a.name,
                "strategy": a.strategy,
                "allocation_usd": a.allocation_usd,
                "weight": a.weight,
                "purchase_price": a.purchase_price or 0.0,
                "shares": round(shares_map.get(a.ticker, 0), 6),
                "current_price": prices.get(a.ticker, a.purchase_price or 0.0),
            }
            for a in portfolio.allocations
        ],
        "current_value_usd": current_value,
        "trend": trend,
    }


@app.delete("/api/portfolios/{portfolio_id}", status_code=204)
def delete_portfolio(portfolio_id: int, session: Session = Depends(get_session)):
    portfolio = session.get(Portfolio, portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    session.delete(portfolio)
    session.commit()