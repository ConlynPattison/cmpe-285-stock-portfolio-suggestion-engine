from contextlib import asynccontextmanager
from datetime import date
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import get_session, init_db
from .models import Portfolio, PortfolioAllocation, PortfolioHistory
from .portfolio_builder import build_portfolio_allocation
from .price_fetcher import fetch_current_prices
from .schemas import (
    PortfolioHistoryResponse,
    PortfolioRequest,
    PortfolioResponse,
    SavedPortfolioDetail,
    SavedPortfolioSummary,
    StrategyMetadata,
)
from .strategy_data import STRATEGY_METADATA


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
    try:
        allocations = build_portfolio_allocation(request.amount_usd, request.strategies)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not allocations:
        raise HTTPException(status_code=400, detail="Could not build a portfolio allocation.")

    prices = fetch_current_prices([item["ticker"] for item in allocations])
    total_value = sum(
        (item["allocation_usd"] / prices[item["ticker"]]) * prices[item["ticker"]]
        for item in allocations
    )

    snapshot_date = date.today().isoformat()
    existing = session.query(PortfolioHistory).filter_by(snapshot_date=snapshot_date).first()
    if existing:
        existing.total_value = total_value
    else:
        session.add(PortfolioHistory(snapshot_date=snapshot_date, total_value=total_value))

    # Persist named portfolio
    if request.name:
        if session.query(Portfolio).filter_by(name=request.name).first():
            raise HTTPException(status_code=409, detail=f"A portfolio named '{request.name}' already exists.")
        portfolio = Portfolio(
            name=request.name,
            amount_usd=request.amount_usd,
            strategies=",".join(request.strategies),
        )
        session.add(portfolio)
        session.flush()
        for item in allocations:
            session.add(PortfolioAllocation(
                portfolio_id=portfolio.id,
                ticker=item["ticker"],
                name=item["name"],
                strategy=item["strategy"],
                allocation_usd=item["allocation_usd"],
                weight=item["weight"],
                purchase_price=prices.get(item["ticker"]),
            ))

    session.commit()

    return {
        "allocations": allocations,
        "total_allocation_usd": round(sum(item["allocation_usd"] for item in allocations), 2),
        "strategy_count": len(request.strategies),
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
                "purchase_price": a.purchase_price,
            }
            for a in portfolio.allocations
        ],
    }


@app.delete("/api/portfolios/{portfolio_id}", status_code=204)
def delete_portfolio(portfolio_id: int, session: Session = Depends(get_session)):
    portfolio = session.get(Portfolio, portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    session.delete(portfolio)
    session.commit()