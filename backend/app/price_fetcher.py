import logging
from typing import Dict, List

import yfinance as yf

logger = logging.getLogger(__name__)


def fetch_current_prices(tickers: List[str]) -> Dict[str, float]:
    """Fetch current prices for a list of tickers using yfinance."""
    prices = {}
    failed = []

    for ticker in tickers:
        try:
            data = yf.Ticker(ticker)
            info = data.fast_info
            price = info.last_price
            if price is None or price <= 0:
                raise ValueError(f"Invalid price for {ticker}: {price}")
            prices[ticker] = round(float(price), 2)
        except Exception as e:
            logger.warning(f"Failed to fetch price for {ticker}: {e}")
            failed.append(ticker)

    if failed:
        raise RuntimeError(f"Could not fetch live prices for: {', '.join(failed)}")

    return prices