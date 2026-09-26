from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)

from app.database import Base


# =========================================================
# USER
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    username = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    phone_number = Column(
        String(20),
        unique=True,
        nullable=False,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    # producer or consumer
    role = Column(
        String(20),
        nullable=False,
    )

    # Account status
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )


# =========================================================
# TRADING LISTING
# =========================================================

class Trading(Base):
    __tablename__ = "trading"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    producer = Column(
        String,
        nullable=False,
    )

    energy = Column(
        Float,
        nullable=False,
    )

    price = Column(
        Float,
        nullable=False,
    )

    status = Column(
        String,
        default="Available",
        nullable=False,
    )


# =========================================================
# BUY REQUEST
# =========================================================

class BuyRequest(Base):
    __tablename__ = "buy_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    consumer = Column(
        String,
        nullable=False,
    )

    producer = Column(
        String,
        nullable=False,
    )

    listing_id = Column(
        Integer,
        ForeignKey("trading.id"),
        nullable=False,
    )

    energy = Column(
        Float,
        nullable=False,
    )

    total_price = Column(
        Float,
        nullable=False,
    )

    status = Column(
        String,
        default="Pending",
        nullable=False,
    )

    reason = Column(
        String(500),
        nullable=True,
    )

    urgency = Column(
        String(20),
        default="Normal",
        nullable=False,
    )

    offered_price = Column(
        Float,
        nullable=True,
    )


# =========================================================
# TRANSACTION
# =========================================================

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # The existing PostgreSQL table stores account names directly. Keep this
    # mapping aligned with that production schema rather than creating a
    # second incompatible transaction representation.
    producer = Column(String, nullable=False)

    consumer = Column(String, nullable=False)

    listing_id = Column(
        Integer,
        # This is required by the live transactions table and references the
        # marketplace listing that supplied the completed energy trade.
        ForeignKey("trading.id"),
        nullable=False,
    )

    energy = Column(
        Float,
        nullable=False,
    )

    price = Column(
        Float,
        nullable=False,
    )

    total_amount = Column(
        Float,
        nullable=False,
    )

    status = Column(
        String,
        default="Completed",
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=True,
    )


# =========================================================
# REVIEW
# =========================================================

class Review(Base):
    __tablename__ = "reviews"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    producer = Column(
        String,
        nullable=False,
    )

    consumer = Column(
        String,
        nullable=False,
    )

    transaction_id = Column(
        Integer,
        ForeignKey("transactions.id"),
        nullable=False,
    )

    rating = Column(
        Integer,
        nullable=False,
    )

    comment = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# =========================================================
# AI NEGOTIATION
# =========================================================

class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Energy listing being negotiated
    listing_id = Column(
        Integer,
        ForeignKey("trading.id"),
        nullable=False,
    )

    # Producer involved in negotiation
    producer = Column(
        String,
        nullable=False,
    )

    # Consumer involved in negotiation
    consumer = Column(
        String,
        nullable=False,
    )

    # Energy quantity being negotiated
    energy = Column(
        Float,
        nullable=False,
    )

    # Original producer asking price
    producer_price = Column(
        Float,
        nullable=False,
    )

    # Consumer's offered price
    consumer_offer = Column(
        Float,
        nullable=False,
    )

    # Price calculated/suggested by negotiation agent
    negotiated_price = Column(
        Float,
        nullable=True,
    )

    # Possible states:
    # Pending
    # Counter Offer
    # Accepted
    # Rejected
    status = Column(
        String,
        default="Pending",
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    reason = Column(String(500), nullable=True)
    urgency = Column(String(20), default="Normal", nullable=False)
