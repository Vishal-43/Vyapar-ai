
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    Index,
    UniqueConstraint,
    JSON,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Commodity(Base):

    __tablename__ = "commodities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(100), index=True)
    unit = Column(String(50), default="Quintal")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    market_prices = relationship("MarketPrice", back_populates="commodity", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="commodity", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="commodity", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Commodity(id={self.id}, name={self.name})>"

class Market(Base):

    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    state = Column(String(100), index=True)
    district = Column(String(100), index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    market_prices = relationship("MarketPrice", back_populates="market", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="market", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="market", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("name", "state", name="uq_market_state"),
    )

    def __repr__(self):
        return f"<Market(id={self.id}, name={self.name}, state={self.state})>"

class MarketPrice(Base):

    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    modal_price = Column(Float, nullable=True)
    price = Column(Float, nullable=False)
    arrival = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    commodity = relationship("Commodity", back_populates="market_prices")
    market = relationship("Market", back_populates="market_prices")

    __table_args__ = (
        Index("ix_market_price_date", "date"),
        Index("ix_market_price_commodity_market_date", "commodity_id", "market_id", "date"),
        UniqueConstraint("commodity_id", "market_id", "date", name="uq_market_price"),
    )

    def __repr__(self):
        return f"<MarketPrice(id={self.id}, commodity_id={self.commodity_id}, market_id={self.market_id}, date={self.date})>"

class Alert(Base):

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=True)
    alert_type = Column(String(50), nullable=False, index=True)
    priority = Column(String(20), default="MEDIUM", index=True)
    status = Column(String(20), default="ACTIVE", index=True)
    conditions = Column(JSON, nullable=True)
    notification_channels = Column(JSON, default=lambda: ["in_app"], nullable=False)
    message = Column(Text, nullable=True)
    triggered_at = Column(DateTime, nullable=True, index=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    commodity = relationship("Commodity", back_populates="alerts")
    market = relationship("Market", back_populates="alerts")

    __table_args__ = (
        Index("ix_alert_status_priority", "status", "priority"),
    )

    def __repr__(self):
        return f"<Alert(id={self.id}, alert_type={self.alert_type}, status={self.status})>"

class Inventory(Base):

    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    current_stock = Column(Float, default=0.0, nullable=False)
    optimal_stock = Column(Float, nullable=True)
    min_stock = Column(Float, nullable=True)
    max_stock = Column(Float, nullable=True)
    reorder_point = Column(Float, nullable=True)
    last_restocked_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    commodity = relationship("Commodity", back_populates="inventory")
    market = relationship("Market", back_populates="inventory")

    __table_args__ = (
        UniqueConstraint("commodity_id", "market_id", name="uq_inventory"),
    )

    def __repr__(self):
        return f"<Inventory(id={self.id}, commodity_id={self.commodity_id}, market_id={self.market_id})>"

class PredictionMetrics(Base):

    __tablename__ = "prediction_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False, index=True)
    model_version = Column(String(50), nullable=False)
    accuracy = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    training_samples = Column(Integer, nullable=True)
    validation_samples = Column(Integer, nullable=True)
    test_samples = Column(Integer, nullable=True)
    training_duration_minutes = Column(Float, nullable=True)
    last_trained_at = Column(DateTime, nullable=True)
    feature_importance = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_prediction_metrics_model", "model_name", "model_version"),
    )

    def __repr__(self):
        return f"<PredictionMetrics(id={self.id}, model_name={self.model_name}, version={self.model_version})>"

class Prediction(Base):

    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    prediction_date = Column(Date, nullable=False, index=True)
    predicted_price = Column(Float, nullable=False)
    actual_price = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    model_used = Column(String(100), nullable=True)
    error = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_prediction_date_commodity_market", "prediction_date", "commodity_id", "market_id"),
    )

    def __repr__(self):
        return f"<Prediction(id={self.id}, commodity_id={self.commodity_id}, market_id={self.market_id})>"

class Discussion(Base):

    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    commodity = Column(String(255), nullable=False, index=True)
    market = Column(String(255), nullable=True)
    author = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    likes_count = Column(Integer, default=0)
    replies_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False, index=True)
    tags = Column(JSON, default=list, nullable=False)
    status = Column(String(20), default="PUBLISHED", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_discussion_commodity_created", "commodity", "created_at"),
        Index("ix_discussion_status", "status"),
    )

    def __repr__(self):
        return f"<Discussion(id={self.id}, title={self.title}, author={self.author})>"

class Comment(Base):

    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    content = Column(Text, nullable=False)
    author = Column(String(255), nullable=True)
    author_id = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Comment(id={self.id}, discussion_id={self.discussion_id})>"

class DiscussionLike(Base):

    __tablename__ = "discussion_likes"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    user_id = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("discussion_id", "user_id", name="uq_discussion_like"),
    )

class Watchlist(Base):

    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=True)
    notes = Column(Text, nullable=True)
    alert_on_price_change = Column(Boolean, default=False)
    price_change_threshold = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    commodity = relationship("Commodity")
    market = relationship("Market")

    __table_args__ = (
        UniqueConstraint("user_id", "commodity_id", "market_id", name="uq_watchlist"),
        Index("ix_watchlist_user", "user_id"),
    )

    def __repr__(self):
        return f"<Watchlist(id={self.id}, user_id={self.user_id}, commodity_id={self.commodity_id})>"

class MarketTrendAnalysis(Base):

    __tablename__ = "market_trend_analysis"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    analysis_date = Column(Date, nullable=False, index=True)
    period_days = Column(Integer, nullable=False)
    avg_price = Column(Float, nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    price_volatility = Column(Float, nullable=False)
    trend_direction = Column(String(20), nullable=False)
    trend_strength = Column(Float, nullable=False)
    momentum = Column(Float, nullable=False)
    total_volume = Column(Float, nullable=True)
    avg_daily_volume = Column(Float, nullable=True)
    analysis_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        UniqueConstraint("commodity_id", "market_id", "analysis_date", "period_days", name="uq_trend_analysis"),
        Index("ix_trend_analysis_date_period", "analysis_date", "period_days"),
    )

    def __repr__(self):
        return f"<MarketTrendAnalysis(id={self.id}, commodity_id={self.commodity_id}, market_id={self.market_id})>"


class Recommendation(Base):
    """AI-generated trading recommendations."""

    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=True)
    recommendation_type = Column(String(20), nullable=False)  # BUY, SELL, HOLD
    confidence_score = Column(Float, nullable=False)  # 0-1
    predicted_price = Column(Float, nullable=True)
    current_price = Column(Float, nullable=True)
    price_change_percent = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    factors = Column(JSON, nullable=True)  # List of factors influencing recommendation
    valid_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    commodity = relationship("Commodity")
    market = relationship("Market")

    __table_args__ = (
        Index("ix_recommendation_commodity", "commodity_id"),
        Index("ix_recommendation_active", "is_active"),
        Index("ix_recommendation_created", "created_at"),
    )

    def __repr__(self):
        return f"<Recommendation(id={self.id}, commodity_id={self.commodity_id}, type={self.recommendation_type})>"
