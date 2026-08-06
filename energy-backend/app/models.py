from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    Float
)
from datetime import datetime
from sqlalchemy import DateTime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(100), unique=True, nullable=False)

    phone_number = Column(String(20), unique=True, nullable=False)

    password_hash = Column(String(255), nullable=False)

    # producer or consumer
    role = Column(String(20), nullable=False)

    # Account status
    is_active = Column(Boolean, default=True)
    

class Trading(Base):
    __tablename__ = "trading"

    id = Column(Integer, primary_key=True, index=True)
    producer = Column(String, nullable=False)
    energy = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    status = Column(String, default="Available")
    
class BuyRequest(Base):
    __tablename__ = "buy_requests"

    id = Column(Integer, primary_key=True, index=True)

    consumer = Column(String)

    producer = Column(String)
    listing_id = Column(Integer, ForeignKey("trading.id"))

    energy = Column(Float)

    total_price = Column(Float)

    status = Column(String, default="Pending")   

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    producer = Column(String, nullable=False)
    consumer = Column(String, nullable=False)

    listing_id = Column(Integer, ForeignKey("trading.id"), nullable=False)
    request_id = Column(Integer, ForeignKey("buy_requests.id"), nullable=False)

    energy = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)

    status = Column(String, default="Completed", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False) 
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    producer = Column(
        String,
        nullable=False
    )

    consumer = Column(
        String,
        nullable=False
    )

    transaction_id = Column(
        Integer,
        ForeignKey("transactions.id"),
        nullable=False
    )

    rating = Column(
        Integer,
        nullable=False
    )

    comment = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )