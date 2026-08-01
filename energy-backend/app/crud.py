from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Trading, BuyRequest
from app.auth import hash_password


# -------------------------------
# Buy Energy
# -------------------------------
async def buy_energy(db, listing_id, consumer, energy):

    print("Listing ID received:", listing_id)

    result = await db.execute(
        select(Trading).where(Trading.id == listing_id)
    )

    listing = result.scalar_one_or_none()

    if listing is None:
        return None

    # Listing already sold out
    if listing.energy <= 0:
        raise Exception("This energy listing is sold out.")

    # User requested more than available
    if energy > listing.energy:
        raise Exception(
            f"Only {listing.energy} kWh available."
        )

    total = energy * listing.price

    request = BuyRequest(
        consumer=consumer,
        producer=listing.producer,
        listing_id=listing.id,
        energy=energy,
        total_price=total,
        status="Pending"
    )

    db.add(request)

    await db.commit()

    await db.refresh(request)

    return request


# -------------------------------
# View Requests
# -------------------------------
async def get_requests(db):

    result = await db.execute(
        select(BuyRequest)
    )

    return result.scalars().all()


# -------------------------------
# Accept Request
# -------------------------------
async def accept_request(db, request_id):

    # Find Buy Request
    result = await db.execute(
        select(BuyRequest).where(
            BuyRequest.id == request_id
        )
    )

    request = result.scalar_one_or_none()

    if request is None:
        return None

    # Already processed
    if request.status != "Pending":
        raise Exception("Request already processed.")

    # Find Trading Listing
    result = await db.execute(
        select(Trading).where(
            Trading.id == request.listing_id
        )
    )

    listing = result.scalar_one_or_none()

    if listing is None:
        raise Exception("Producer listing not found.")

    # Sold out
    if listing.energy <= 0:
        raise Exception("This listing is already sold out.")

    # Not enough energy
    if listing.energy < request.energy:
        raise Exception("Not enough energy available.")

    # Deduct energy
    listing.energy -= request.energy

    if listing.energy <= 0:
        listing.energy = 0
        listing.status = "Sold Out"
    else:
        listing.status = "Available"

    # Accept request
    request.status = "Accepted"

    await db.commit()

    await db.refresh(request)
    await db.refresh(listing)

    return request


# -------------------------------
# Reject Request
# -------------------------------
async def reject_request(db, request_id):

    result = await db.execute(
        select(BuyRequest).where(
            BuyRequest.id == request_id
        )
    )

    request = result.scalar_one_or_none()

    if request is None:
        return None

    if request.status != "Pending":
        raise Exception("Request already processed.")

    request.status = "Rejected"

    await db.commit()

    await db.refresh(request)

    return request


# -------------------------------
# Create Trading
# -------------------------------
async def create_trading(
    db: AsyncSession,
    producer: str,
    energy: float,
    price: float
):

    trade = Trading(
        producer=producer,
        energy=energy,
        price=price,
        status="Available"
    )

    db.add(trade)

    await db.commit()

    await db.refresh(trade)

    return trade


# -------------------------------
# Get All Trading
# -------------------------------
async def get_all_trading(db: AsyncSession):

    result = await db.execute(
        select(Trading).where(
            Trading.energy > 0
        )
    )

    return result.scalars().all()


# -------------------------------
# Create Listing
# -------------------------------
async def create_listing(
    db,
    producer,
    energy,
    price
):

    listing = Trading(
        producer=producer,
        energy=energy,
        price=price,
        status="Available"
    )

    db.add(listing)

    await db.commit()

    await db.refresh(listing)

    return listing


# -------------------------------
# Get User By Username
# -------------------------------
async def get_user_by_username(
    db: AsyncSession,
    username: str
):

    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    return result.scalar_one_or_none()


# -------------------------------
# Get User By Phone
# -------------------------------
async def get_user_by_phone(
    db: AsyncSession,
    phone_number: str
):

    result = await db.execute(
        select(User).where(
            User.phone_number == phone_number
        )
    )

    return result.scalar_one_or_none()


# -------------------------------
# Create User
# -------------------------------
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