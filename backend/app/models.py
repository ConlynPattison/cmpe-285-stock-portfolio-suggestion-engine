from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .db import Base


class PortfolioHistory(Base):
    __tablename__ = "portfolio_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    snapshot_date = Column(String, unique=True, index=True)
    total_value = Column(Float)


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    amount_usd = Column(Float, nullable=False)
    strategies = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    allocations = relationship(
        "PortfolioAllocation",
        back_populates="portfolio",
        cascade="all, delete-orphan",
    )


class PortfolioAllocation(Base):
    __tablename__ = "portfolio_allocations"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    ticker = Column(String, nullable=False)
    name = Column(String, nullable=False)
    strategy = Column(String, nullable=False)
    allocation_usd = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    purchase_price = Column(Float, nullable=True)

    portfolio = relationship("Portfolio", back_populates="allocations")