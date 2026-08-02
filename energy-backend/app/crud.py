from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, EnergyListing
from app.auth import hash_password


# Get user by username
async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(
        select(User).where(User.username == username)
    )
    return result.scalar_one_or_none()


# Get user by phone number
async def get_user_by_phone(db: AsyncSession, phone_number: str):
    result = await db.execute(
        select(User).where(User.phone_number == phone_number)
    )
    return result.scalar_one_or_none()


# Create a new user
async def create_user(
    db: AsyncSession,
    username: str,
    phone_number: str,
    password: str,
    role: str
):
    user = User(
        username=username,
        phone_number=phone_number,
        password_hash=hash_password(password),
        role=role,
        is_active=True
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user

# -----------------------------
# ENERGY LISTINGS
# -----------------------------

async def create_energy_listing(
    db: AsyncSession,
    producer_id: int,
    available_energy: float,
    price_per_kwh: float,
    energy_source: str
):
    listing = EnergyListing(
        producer_id=producer_id,
        available_energy=available_energy,
        price_per_kwh=price_per_kwh,
        energy_source=energy_source,
        status="Available"
    )

    db.add(listing)
    await db.commit()
    await db.refresh(listing)

    return listing


async def get_producer_energy(
    db: AsyncSession,
    producer_id: int
):
    result = await db.execute(
        select(EnergyListing).where(
            EnergyListing.producer_id == producer_id
        )
    )

    return result.scalars().all()

async def get_available_energy(db: AsyncSession):
    result = await db.execute(
        select(EnergyListing).where(
            EnergyListing.status == "Available"
        )
    )

    return result.scalars().all()