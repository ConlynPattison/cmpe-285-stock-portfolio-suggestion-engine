from typing import Dict, List, Literal, TypedDict

StrategyName = Literal["ethical", "growth", "index", "quality", "value"]


class Asset(TypedDict):
    ticker: str
    name: str
    asset_type: str
    rationale: str


STRATEGY_METADATA: Dict[StrategyName, Dict[str, str]] = {
    "ethical": {
        "label": "Ethical Investing",
        "description": "ESG and sustainability-focused assets with responsible characteristics.",
    },
    "growth": {
        "label": "Growth Investing",
        "description": "Companies and funds with above-average revenue or earnings growth potential.",
    },
    "index": {
        "label": "Index Investing",
        "description": "Broad market ETFs that provide diversified exposure across asset classes.",
    },
    "quality": {
        "label": "Quality Investing",
        "description": "Financially strong companies with durable businesses and stable cash flow.",
    },
    "value": {
        "label": "Value Investing",
        "description": "Undervalued names trading below intrinsic value with attractive cash flows.",
    },
}

STRATEGY_ASSETS: Dict[StrategyName, List[Asset]] = {
    "ethical": [
        {"ticker": "NEE", "name": "NextEra Energy", "asset_type": "stock", "rationale": "Large renewable-energy utility."},
        {"ticker": "ENPH", "name": "Enphase Energy", "asset_type": "stock", "rationale": "Solar energy microinverters."},
        {"ticker": "BEP", "name": "Brookfield Renewable Partners", "asset_type": "stock", "rationale": "Global renewable asset manager."},
        {"ticker": "ORSTED", "name": "Ørsted A/S", "asset_type": "stock", "rationale": "Offshore wind energy leader."},
        {"ticker": "DSI", "name": "iShares MSCI KLD 400 Social ETF", "asset_type": "etf", "rationale": "Socially responsible US equity exposure."},
        {"ticker": "ESGU", "name": "iShares ESG Aware MSCI USA ETF", "asset_type": "etf", "rationale": "Broad ESG-aware US equity ETF."},
        {"ticker": "ESGV", "name": "Vanguard ESG U.S. Stock ETF", "asset_type": "etf", "rationale": "Low-cost US ESG equity exposure."},
        {"ticker": "SUSA", "name": "iShares MSCI USA ESG Select ETF", "asset_type": "etf", "rationale": "US ESG select index ETF."},
        {"ticker": "ICLN", "name": "iShares Global Clean Energy ETF", "asset_type": "etf", "rationale": "Global clean energy companies."},
        {"ticker": "TAN", "name": "Invesco Solar ETF", "asset_type": "etf", "rationale": "Solar industry exposure."},
    ],
    "growth": [
        {"ticker": "NVDA", "name": "Nvidia", "asset_type": "stock", "rationale": "AI and data-center growth leader."},
        {"ticker": "SHOP", "name": "Shopify", "asset_type": "stock", "rationale": "E-commerce platform growth."},
        {"ticker": "AMD", "name": "Advanced Micro Devices", "asset_type": "stock", "rationale": "Semiconductor growth champion."},
        {"ticker": "MDB", "name": "MongoDB", "asset_type": "stock", "rationale": "Cloud database growth."},
        {"ticker": "ZM", "name": "Zoom Video Communications", "asset_type": "stock", "rationale": "Communications platform."},
        {"ticker": "CRWD", "name": "CrowdStrike", "asset_type": "stock", "rationale": "Cybersecurity growth company."},
        {"ticker": "SNOW", "name": "Snowflake", "asset_type": "stock", "rationale": "Cloud data warehousing."},
        {"ticker": "PLTR", "name": "Palantir", "asset_type": "stock", "rationale": "Data analytics software."},
        {"ticker": "ARKK", "name": "ARK Innovation ETF", "asset_type": "etf", "rationale": "Thematic growth innovation ETF."},
        {"ticker": "ARKW", "name": "ARK Next Generation Internet ETF", "asset_type": "etf", "rationale": "Internet and technology innovation ETF."},
    ],
    "index": [
        {"ticker": "VTI", "name": "Vanguard Total Stock Market ETF", "asset_type": "etf", "rationale": "Broad US equity market coverage."},
        {"ticker": "IXUS", "name": "iShares Core MSCI Total International Stock ETF", "asset_type": "etf", "rationale": "Global ex-US equity exposure."},
        {"ticker": "ILTB", "name": "iShares Core 10+ Year USD Bond ETF", "asset_type": "etf", "rationale": "Long-term US bond exposure."},
        {"ticker": "VOO", "name": "Vanguard S&P 500 ETF", "asset_type": "etf", "rationale": "Large-cap US market benchmark."},
        {"ticker": "VT", "name": "Vanguard Total World Stock ETF", "asset_type": "etf", "rationale": "Worldwide equity market coverage."},
        {"ticker": "SCHB", "name": "Schwab U.S. Broad Market ETF", "asset_type": "etf", "rationale": "Broad US stock market ETF."},
        {"ticker": "IVV", "name": "iShares Core S&P 500 ETF", "asset_type": "etf", "rationale": "S&P 500 index tracking."},
        {"ticker": "VEA", "name": "Vanguard FTSE Developed Markets ETF", "asset_type": "etf", "rationale": "Developed markets international exposure."},
        {"ticker": "AGG", "name": "iShares Core U.S. Aggregate Bond ETF", "asset_type": "etf", "rationale": "Broad US investment-grade bond exposure."},
        {"ticker": "EFA", "name": "iShares MSCI EAFE ETF", "asset_type": "etf", "rationale": "Developed markets ex-North America."},
    ],
    "quality": [
        {"ticker": "MSFT", "name": "Microsoft", "asset_type": "stock", "rationale": "High-quality cash flow and durable moat."},
        {"ticker": "JNJ", "name": "Johnson & Johnson", "asset_type": "stock", "rationale": "Stable healthcare franchise."},
        {"ticker": "PG", "name": "Procter & Gamble", "asset_type": "stock", "rationale": "Consumer staples quality compounder."},
        {"ticker": "KO", "name": "Coca-Cola", "asset_type": "stock", "rationale": "Reliable global beverage brand."},
        {"ticker": "AAPL", "name": "Apple", "asset_type": "stock", "rationale": "Strong cash flow and brand loyalty."},
        {"ticker": "MCD", "name": "McDonald’s", "asset_type": "stock", "rationale": "Proven business model with durable cash generation."},
        {"ticker": "UNH", "name": "UnitedHealth Group", "asset_type": "stock", "rationale": "Leading managed-care operator."},
        {"ticker": "V", "name": "Visa", "asset_type": "stock", "rationale": "High-margin payment network."},
        {"ticker": "ACN", "name": "Accenture", "asset_type": "stock", "rationale": "Stable IT services leader."},
        {"ticker": "VIG", "name": "Vanguard Dividend Appreciation ETF", "asset_type": "etf", "rationale": "Dividend growers with quality characteristics."},
    ],
    "value": [
        {"ticker": "BRK.B", "name": "Berkshire Hathaway", "asset_type": "stock", "rationale": "Diversified conglomerate with value orientation."},
        {"ticker": "INTC", "name": "Intel", "asset_type": "stock", "rationale": "Large-cap semiconductor with value characteristics."},
        {"ticker": "IBM", "name": "IBM", "asset_type": "stock", "rationale": "Legacy technology with attractively priced cash flow."},
        {"ticker": "CVS", "name": "CVS Health", "asset_type": "stock", "rationale": "Healthcare retailer with cash flow and value appeal."},
        {"ticker": "PFE", "name": "Pfizer", "asset_type": "stock", "rationale": "Pharmaceutical value name."},
        {"ticker": "WFC", "name": "Wells Fargo", "asset_type": "stock", "rationale": "Banking exposure with value tilt."},
        {"ticker": "VZ", "name": "Verizon", "asset_type": "stock", "rationale": "Telecom income-oriented value stock."},
        {"ticker": "XOM", "name": "Exxon Mobil", "asset_type": "stock", "rationale": "Energy value name with strong cash generation."},
        {"ticker": "FCX", "name": "Freeport-McMoRan", "asset_type": "stock", "rationale": "Commodity value with metals exposure."},
        {"ticker": "T", "name": "AT&T", "asset_type": "stock", "rationale": "High-dividend telecom value stock."},
    ],
}
