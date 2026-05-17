from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from .db import Base


class PortfolioHistory(Base):
    __tablename__ = "portfolio_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    snapshot_date = Column(String, unique=True, index=True)
    total_value = Column(Float)
