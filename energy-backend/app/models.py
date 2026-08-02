from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from datetime import datetime
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


# -------------------------------
# Energy Listing
# -------------------------------
class EnergyListing(Base):
    __tablename__ = "energy_listings"

    id = Column(Integer, primary_key=True, index=True)

    producer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    available_energy = Column(Float, nullable=False)   # kWh
    price_per_kwh = Column(Float, nullable=False)

    energy_source = Column(String(50), nullable=False)  # Solar, Wind, etc.

    status = Column(String(20), default="Available")

    created_at = Column(DateTime, default=datetime.utcnow)


# -------------------------------
# Transaction
# -------------------------------
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    producer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    consumer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    energy_kwh = Column(Float, nullable=False)

    price_per_kwh = Column(Float, nullable=False)

    total_amount = Column(Float, nullable=False)

    status = Column(String(20), default="Completed")

    created_at = Column(DateTime, default=datetime.utcnow)
    
    listing_id = Column(Integer,ForeignKey("energy_listings.id"),nullable=False)

# -------------------------------
# Review
# -------------------------------
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)

    producer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    consumer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    rating = Column(Integer, nullable=False)

    comment = Column(String(500), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)