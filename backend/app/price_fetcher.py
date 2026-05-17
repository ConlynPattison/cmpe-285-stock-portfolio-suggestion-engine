from typing import Dict, List


def fetch_current_prices(tickers: List[str]) -> Dict[str, float]:
    """Stub price fetcher.

    Replace this function with a live market data provider for real current pricing.
    """
    return {
        ticker: round(100.0 + index * 7.5, 2)
        for index, ticker in enumerate(tickers)
    }
