from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, conlist

StrategyName = Literal["ethical", "growth", "index", "quality", "value"]


class StrategyMetadata(BaseModel):
    name: StrategyName
    label: str
    description: str


class AssetAllocation(BaseModel):
    ticker: str
    name: str
    strategy: StrategyName
    allocation_usd: float
    weight: float


class PortfolioRequest(BaseModel):
    amount_usd: float = Field(..., ge=5000)
    strategies: conlist(StrategyName, min_length=1, max_length=2)
    name: Optional[str] = None  # if provided, portfolio is persisted


class PortfolioResponse(BaseModel):
    allocations: List[AssetAllocation]
    total_allocation_usd: float
    strategy_count: int


class HistoryItem(BaseModel):
    snapshot_date: str
    total_value: float


class PortfolioHistoryResponse(BaseModel):
    history: List[HistoryItem]


class SavedAllocation(BaseModel):
    ticker: str
    name: str
    strategy: str
    allocation_usd: float
    weight: float
    purchase_price: Optional[float] = None


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
    allocations: List[SavedAllocation]