from contextlib import asynccontextmanager
from datetime import date
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import get_session, init_db
from .models import PortfolioHistory
from .portfolio_builder import build_portfolio_allocation
from .price_fetcher import fetch_current_prices
from .schemas import (
    PortfolioHistoryResponse,
    PortfolioRequest,
    PortfolioResponse,
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
