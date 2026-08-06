from urllib import request

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Trading, BuyRequest, Transaction,  Review
from app.auth import hash_password, verify_password


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

    transaction = Transaction(
        producer=request.producer,
        consumer=request.consumer,
        listing_id=listing.id,
        request_id=request.id,
        energy=request.energy,
        price=listing.price,
        total_amount=request.total_price,
        status="Completed"
    )

    db.add(transaction)

    await db.commit()

    await db.refresh(request)
    await db.refresh(listing)
    await db.refresh(transaction)

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

async def get_transactions_by_producer(
    db: AsyncSession,
    producer: str
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.producer == producer)
        .order_by(Transaction.created_at.desc())
    )

    return result.scalars().all()


async def get_transactions_by_consumer(
    db: AsyncSession,
    consumer: str
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.consumer == consumer)
        .order_by(Transaction.created_at.desc())
    )

    return result.scalars().all()

# -------------------------------
# Producer Market Insights
# -------------------------------
async def get_market_data(
    db: AsyncSession,
    current_producer: str
):
    """
    Returns active listings from OTHER producers
    along with market price statistics.
    """

    result = await db.execute(
        select(Trading)
        .where(
            Trading.energy > 0,
            Trading.status == "Available",
            Trading.producer != current_producer
        )
        .order_by(Trading.price.asc())
    )

    listings = result.scalars().all()

    # No other producer listings available
    if not listings:
        return {
            "market_summary": {
                "lowest_price": 0,
                "highest_price": 0,
                "average_price": 0,
                "total_energy_available": 0,
                "active_listings": 0
            },
            "listings": []
        }

    prices = [listing.price for listing in listings]
    energies = [listing.energy for listing in listings]

    return {
        "market_summary": {
            "lowest_price": round(min(prices), 2),
            "highest_price": round(max(prices), 2),
            "average_price": round(sum(prices) / len(prices), 2),
            "total_energy_available": round(sum(energies), 2),
            "active_listings": len(listings)
        },

        "listings": [
            {
                "id": listing.id,
                "producer": listing.producer,
                "energy": round(listing.energy, 2),
                "price": round(listing.price, 2),
                "status": listing.status
            }
            for listing in listings
        ]
    }

async def get_market_listings(
    db: AsyncSession,
    current_producer: str
):
    result = await db.execute(
        select(Trading)
        .where(
            Trading.energy > 0,
            Trading.status == "Available",
            Trading.producer != current_producer
        )
        .order_by(Trading.price.asc())
    )

    return result.scalars().all()

# -------------------------------
# Create Producer Review
# -------------------------------
async def create_review(
    db: AsyncSession,
    transaction_id: int,
    consumer: str,
    rating: int,
    comment: str | None = None
):
    # Find transaction
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id
        )
    )

    transaction = result.scalar_one_or_none()

    if transaction is None:
        raise Exception("Transaction not found.")

    # Make sure the person reviewing is the actual buyer
    if transaction.consumer != consumer:
        raise Exception(
            "You can review only your own purchases."
        )

    # Only completed transactions can be reviewed
    if transaction.status != "Completed":
        raise Exception(
            "Only completed transactions can be reviewed."
        )

    # Rating validation
    if rating < 1 or rating > 5:
        raise Exception(
            "Rating must be between 1 and 5."
        )

    # Check whether this transaction already has a review
    result = await db.execute(
        select(Review).where(
            Review.transaction_id == transaction_id
        )
    )

    existing_review = result.scalar_one_or_none()

    if existing_review is not None:
        raise Exception(
            "This transaction has already been reviewed."
        )

    review = Review(
        producer=transaction.producer,
        consumer=consumer,
        transaction_id=transaction.id,
        rating=rating,
        comment=comment
    )

    db.add(review)

    await db.commit()

    await db.refresh(review)

    return review


# -------------------------------
# Get Reviews For Producer
# -------------------------------
async def get_producer_reviews(
    db: AsyncSession,
    producer: str
):
    result = await db.execute(
        select(Review)
        .where(
            Review.producer == producer
        )
        .order_by(
            Review.created_at.desc()
        )
    )

    reviews = result.scalars().all()

    if not reviews:
        return {
            "producer": producer,
            "total_reviews": 0,
            "average_rating": 0,
            "reviews": []
        }

    ratings = [
        review.rating
        for review in reviews
    ]

    return {
        "producer": producer,
        "total_reviews": len(reviews),
        "average_rating": round(
            sum(ratings) / len(ratings),
            2
        ),
        "reviews": [
            {
                "id": review.id,
                "consumer": review.consumer,
                "rating": review.rating,
                "comment": review.comment,
                "transaction_id": review.transaction_id,
                "created_at": (
                    review.created_at.isoformat()
                    if review.created_at
                    else None
                )
            }
            for review in reviews
        ]
    }

# -------------------------------
# Get Producer Settings
# -------------------------------
async def get_settings(
    db: AsyncSession,
    username: str
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise Exception("User not found.")

    return {
        "username": user.username,
        "phone_number": user.phone_number,
        "role": user.role,
        "is_active": user.is_active,
        "default_selling_price": 0.0
    }


# -------------------------------
# Update Producer Settings
# -------------------------------
async def update_settings(
    db: AsyncSession,
    username: str,
    phone_number: str | None = None,
    default_selling_price: float | None = None
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise Exception("User not found.")

    if phone_number is not None:
        user.phone_number = phone_number

    await db.commit()
    await db.refresh(user)

    return {
        "username": user.username,
        "phone_number": user.phone_number,
        "role": user.role,
        "is_active": user.is_active,
        "default_selling_price": (
            default_selling_price
            if default_selling_price is not None
            else 0.0
        )
    }

# -------------------------------
# Get Settings
# -------------------------------
async def get_settings(
    db: AsyncSession,
    username: str
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise Exception("User not found.")

    return {
        "username": user.username,
        "phone_number": user.phone_number,
        "role": user.role,
        "is_active": user.is_active,
        "default_selling_price": 0.0
    }


# -------------------------------
# Update Settings
# -------------------------------
async def update_settings(
    db: AsyncSession,
    username: str,
    phone_number: str | None = None,
    default_selling_price: float | None = None
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise Exception("User not found.")

    if phone_number is not None:
        user.phone_number = phone_number

    await db.commit()
    await db.refresh(user)

    return {
        "username": user.username,
        "phone_number": user.phone_number,
        "role": user.role,
        "is_active": user.is_active,
        "default_selling_price": (
            default_selling_price
            if default_selling_price is not None
            else 0.0
        )
    }


# -------------------------------
# Change Password
# -------------------------------
async def change_password(
    db: AsyncSession,
    username: str,
    current_password: str,
    new_password: str
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise Exception("User not found.")

    # Check current password
    if not verify_password(
        current_password,
        user.password_hash
    ):
        raise Exception(
            "Current password is incorrect."
        )

    # Prevent same password
    if verify_password(
        new_password,
        user.password_hash
    ):
        raise Exception(
            "New password must be different."
        )

    # Hash new password
    user.password_hash = hash_password(
        new_password
    )

    await db.commit()
    await db.refresh(user)

    return {
        "message": "Password changed successfully."
    }