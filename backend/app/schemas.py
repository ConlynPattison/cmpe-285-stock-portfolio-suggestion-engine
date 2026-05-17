from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field
from pydantic import conlist

StrategyName = Literal["ethical", "growth", "index", "quality", "value"]


class StrategyMetadata(BaseModel):
    name: StrategyName
    label: str
    description: str


class TrendPoint(BaseModel):
    date: str
    total_value_usd: float


class AllocationItem(BaseModel):
    ticker: str
    name: str
    strategy: str
    allocation_usd: float
    weight: float
    shares: float
    purchase_price: float
    current_price: float


class PortfolioRequest(BaseModel):
    amount_usd: float = Field(..., ge=5000)
    strategies: conlist(StrategyName, min_length=1, max_length=2)


class PortfolioResponse(BaseModel):
    allocations: List[AllocationItem]
    total_allocation_usd: float
    current_value_usd: float
    strategy_count: int
    trend: List[TrendPoint]


class SaveAllocationInput(BaseModel):
    ticker: str
    name: str
    strategy: str
    allocation_usd: float
    weight: float
    purchase_price: float


class SavePortfolioRequest(BaseModel):
    name: str
    amount_usd: float
    strategies: List[str]
    allocations: List[SaveAllocationInput]


class SavedPortfolioSummary(BaseModel):
    id: int
    name: str
    amount_usd: float
    strategies: List[str]
    created_at: datetime


class SavedPortfolioDetail(BaseModel):
    id: int
    name: str
    amount_usd: float
    strategies: List[str]
    created_at: datetime
    allocations: List[AllocationItem]
    current_value_usd: float
    trend: List[TrendPoint]


# Legacy schema kept for /api/portfolio/history endpoint
class HistoryItem(BaseModel):
    snapshot_date: str
    total_value: float


class PortfolioHistoryResponse(BaseModel):
    history: List[HistoryItem]
