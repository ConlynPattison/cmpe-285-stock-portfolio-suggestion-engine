from typing import List, Literal

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


class PortfolioResponse(BaseModel):
    allocations: List[AssetAllocation]
    total_allocation_usd: float
    strategy_count: int


class HistoryItem(BaseModel):
    snapshot_date: str
    total_value: float


class PortfolioHistoryResponse(BaseModel):
    history: List[HistoryItem]
