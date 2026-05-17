import random
from typing import List, Optional

from .strategy_data import STRATEGY_ASSETS, StrategyName

MIN_INVESTMENT_AMOUNT = 5000
MAX_STRATEGIES = 2
DEFAULT_ASSETS_PER_STRATEGY = 3


def build_portfolio_allocation(
    amount_usd: float,
    strategies: List[StrategyName],
    assets_per_strategy: int = DEFAULT_ASSETS_PER_STRATEGY,
    rng: Optional[random.Random] = None,
):
    if amount_usd < MIN_INVESTMENT_AMOUNT:
        raise ValueError(f"Investment amount must be at least ${MIN_INVESTMENT_AMOUNT}")
    if len(strategies) < 1 or len(strategies) > MAX_STRATEGIES:
        raise ValueError("Select 1 or 2 strategies only.")

    picker = rng or random
    selected: List[tuple] = []
    for strategy in strategies:
        pool = STRATEGY_ASSETS[strategy]
        k = min(assets_per_strategy, len(pool))
        for asset in picker.sample(pool, k):
            selected.append((strategy, asset))

    if not selected:
        return []

    asset_count = len(selected)
    allocation_usd = round(amount_usd / asset_count, 2)
    weight = round(1.0 / asset_count, 4)

    return [
        {
            "ticker": asset["ticker"],
            "name": asset["name"],
            "strategy": strategy,
            "allocation_usd": allocation_usd,
            "weight": weight,
        }
        for strategy, asset in selected
    ]


def summarize_allocations(allocations: List[dict]) -> dict:
    total = sum(item["allocation_usd"] for item in allocations)
    return {
        "total_allocation_usd": round(total, 2),
        "asset_count": len(allocations),
    }
