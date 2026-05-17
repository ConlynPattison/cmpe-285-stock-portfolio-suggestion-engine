import logging
import time
from typing import Dict, List

import yfinance as yf

logger = logging.getLogger(__name__)

# Simple in-process cache: {frozenset(tickers): (timestamp, prices)}
_price_cache: Dict[frozenset, tuple] = {}
_CACHE_TTL = 60  # seconds


def _download_with_retry(tickers: List[str], period: str, retries: int = 3, delay: float = 2.0):
    """Run yf.download with exponential-backoff retries on rate-limit errors."""
    for attempt in range(retries):
        df = yf.download(tickers, period=period, auto_adjust=True, progress=False, threads=False)
        if not df.empty:
            return df
        if attempt < retries - 1:
            wait = delay * (2 ** attempt)
            logger.info(f"yf.download returned empty (rate-limited?), retrying in {wait}s…")
            time.sleep(wait)
    return df  # return whatever we have (possibly empty) after exhausting retries


def fetch_current_prices(tickers: List[str]) -> Dict[str, float]:
    """Fetch current (or most-recent close) prices for a list of tickers using yfinance."""
    cache_key = frozenset(tickers)
    cached = _price_cache.get(cache_key)
    if cached and (time.time() - cached[0]) < _CACHE_TTL:
        logger.info("Returning cached prices")
        return cached[1]

    try:
        df = _download_with_retry(tickers, period="5d")
        if df.empty:
            raise RuntimeError("yf.download returned empty DataFrame after retries")

        close = df["Close"] if "Close" in df.columns else df

        prices: Dict[str, float] = {}
        failed: List[str] = []

        for ticker in tickers:
            try:
                col = (close[ticker] if hasattr(close, "columns") else close).dropna()
                if col.empty:
                    raise ValueError("No data")
                prices[ticker] = round(float(col.iloc[-1]), 2)
            except Exception as e:
                logger.warning(f"No price for {ticker} in batch data: {e}")
                failed.append(ticker)

        # Retry failed tickers individually (handles dot-tickers like BRK.B)
        still_failed: List[str] = []
        for ticker in failed:
            try:
                hist = yf.Ticker(ticker).history(period="5d", auto_adjust=True)
                if not hist.empty and "Close" in hist.columns:
                    prices[ticker] = round(float(hist["Close"].dropna().iloc[-1]), 2)
                    logger.info(f"Fetched {ticker} individually: {prices[ticker]}")
                else:
                    still_failed.append(ticker)
            except Exception as e:
                logger.warning(f"Individual fetch failed for {ticker}: {e}")
                still_failed.append(ticker)

        if still_failed:
            raise RuntimeError(f"Could not fetch live prices for: {', '.join(still_failed)}")

        _price_cache[cache_key] = (time.time(), prices)
        return prices

    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Batch price fetch failed: {e}") from e


def fetch_historical_prices(tickers: List[str], days: int = 5) -> Dict[str, List[Dict]]:
    """Fetch the last `days` trading-day close prices for each ticker (single batch request)."""
    result: Dict[str, List[Dict]] = {t: [] for t in tickers}
    try:
        df = _download_with_retry(tickers, period="15d")
        if df.empty:
            logger.warning("yf.download returned empty DataFrame for historical prices")
            return result

        close = df["Close"] if "Close" in df.columns else df

        for ticker in tickers:
            try:
                col = (close[ticker] if hasattr(close, "columns") else close).dropna()
                result[ticker] = [
                    {"date": idx.strftime("%Y-%m-%d"), "close": round(float(price), 2)}
                    for idx, price in col.tail(days).items()
                ]
            except Exception as e:
                logger.warning(f"No history for {ticker} in batch data: {e}")
                # Individual fallback for dot-tickers like BRK.B
                try:
                    hist = yf.Ticker(ticker).history(period="15d", auto_adjust=True)
                    if not hist.empty and "Close" in hist.columns:
                        col = hist["Close"].dropna()
                        result[ticker] = [
                            {"date": idx.strftime("%Y-%m-%d"), "close": round(float(price), 2)}
                            for idx, price in col.tail(days).items()
                        ]
                except Exception as e2:
                    logger.warning(f"Individual historical fallback failed for {ticker}: {e2}")

    except Exception as exc:
        logger.warning(f"Batch historical fetch failed: {exc}")

    return result
