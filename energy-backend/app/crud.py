from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    User,
    Trading,
    BuyRequest,
    Transaction,
    Review,
    Negotiation,
)

from app.auth import (
    hash_password,
    verify_password,
)


def _transaction_response(transaction: Transaction) -> dict:
    """Expose stable API names while reading the live legacy table columns."""
    return {
        "id": transaction.id,
        "producer": transaction.producer,
        "consumer": transaction.consumer,
        "listing_id": transaction.listing_id,
        "request_id": None,
        "energy": transaction.energy,
        "price": transaction.price,
        "total_amount": transaction.total_amount,
        "status": transaction.status,
        "created_at": transaction.created_at,
    }


# =========================================================
# BUY ENERGY
# =========================================================

async def buy_energy(
    db: AsyncSession,
    listing_id: int,
    consumer: str,
    energy: float,
    reason: str,
    urgency: str,
):
    result = await db.execute(
        select(Trading).where(
            Trading.id == listing_id
        )
    )

    listing = result.scalar_one_or_none()

    if listing is None:
        return None

    if energy <= 0:
        raise Exception(
            "Energy must be greater than zero."
        )

    if float(listing.energy) <= 0:
        raise Exception(
            "This energy listing is sold out."
        )

    if float(energy) > float(listing.energy):
        raise Exception(
            f"Only {listing.energy} kWh available."
        )

    total = round(
        float(energy) * float(listing.price),
        2,
    )

    request = BuyRequest(
        consumer=consumer,
        producer=listing.producer,
        listing_id=listing.id,
        energy=energy,
        total_price=total,
        status="Pending",
        reason=reason,
        urgency=urgency,
        offered_price=float(listing.price),
    )

    db.add(request)

    await db.commit()
    await db.refresh(request)

    return request


# =========================================================
# GET BUY REQUESTS
# =========================================================

async def get_requests(
    db: AsyncSession,
):
    result = await db.execute(
        select(BuyRequest)
        .order_by(
            BuyRequest.id.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# ACCEPT BUY REQUEST
# =========================================================

async def accept_request(
    db: AsyncSession,
    request_id: int,
):
    result = await db.execute(
        select(BuyRequest).where(
            BuyRequest.id == request_id
        )
    )

    request = result.scalar_one_or_none()

    if request is None:
        return None

    if request.status != "Pending":
        raise Exception(
            "Request already processed."
        )

    result = await db.execute(
        select(Trading).where(
            Trading.id == request.listing_id
        )
    )

    listing = result.scalar_one_or_none()

    if listing is None:
        raise Exception(
            "Producer listing not found."
        )

    if float(listing.energy) <= 0:
        raise Exception(
            "This listing is already sold out."
        )

    if float(listing.energy) < float(request.energy):
        raise Exception(
            "Not enough energy available."
        )

    # Deduct energy
    listing.energy = round(
        float(listing.energy)
        - float(request.energy),
        2,
    )

    if listing.energy <= 0:
        listing.energy = 0
        listing.status = "Sold Out"
    else:
        listing.status = "Available"

    # Accept request
    request.status = "Accepted"

    # Create transaction
    transaction = Transaction(
        producer=request.producer,
        consumer=request.consumer,
        listing_id=request.listing_id,
        energy=request.energy,
        price=listing.price,
        total_amount=request.total_price,
        status="Completed",
    )

    db.add(transaction)

    await db.commit()

    await db.refresh(request)
    await db.refresh(listing)
    await db.refresh(transaction)

    return request


# =========================================================
# REJECT BUY REQUEST
# =========================================================

async def reject_request(
    db: AsyncSession,
    request_id: int,
):
    result = await db.execute(
        select(BuyRequest).where(
            BuyRequest.id == request_id
        )
    )

    request = result.scalar_one_or_none()

    if request is None:
        return None

    if request.status != "Pending":
        raise Exception(
            "Request already processed."
        )

    request.status = "Rejected"

    await db.commit()
    await db.refresh(request)

    return request


# =========================================================
# CREATE TRADING LISTING
# =========================================================

async def create_trading(
    db: AsyncSession,
    producer: str,
    energy: float,
    price: float,
):
    if energy <= 0:
        raise Exception(
            "Energy must be greater than zero."
        )

    if price < 0:
        raise Exception(
            "Price cannot be negative."
        )

    trade = Trading(
        producer=producer,
        energy=energy,
        price=price,
        status="Available",
    )

    db.add(trade)

    await db.commit()
    await db.refresh(trade)

    return trade


# =========================================================
# CREATE LISTING
# =========================================================

async def create_listing(
    db: AsyncSession,
    producer: str,
    energy: float,
    price: float,
):
    return await create_trading(
        db=db,
        producer=producer,
        energy=energy,
        price=price,
    )


# =========================================================
# GET ALL TRADING LISTINGS
# =========================================================

async def get_all_trading(
    db: AsyncSession,
):
    result = await db.execute(
        select(Trading)
        .where(
            Trading.energy > 0,
            Trading.status == "Available",
        )
        .order_by(
            Trading.id.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# GET TRADING LISTING BY ID
# =========================================================

async def get_trading_listing(
    db: AsyncSession,
    listing_id: int,
):
    result = await db.execute(
        select(Trading).where(
            Trading.id == listing_id,
            Trading.energy > 0,
            Trading.status == "Available",
        )
    )

    return result.scalar_one_or_none()


# =========================================================
# GET NEGOTIATIONS FOR PRODUCER
# =========================================================

async def get_negotiations_by_producer(
    db: AsyncSession,
    producer: str,
):
    result = await db.execute(
        select(Negotiation)
        .where(
            Negotiation.producer == producer
        )
        .order_by(
            Negotiation.id.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# GET USER BY USERNAME
# =========================================================

async def get_user_by_username(
    db: AsyncSession,
    username: str,
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    return result.scalar_one_or_none()


# =========================================================
# GET USER BY PHONE
# =========================================================

async def get_user_by_phone(
    db: AsyncSession,
    phone_number: str,
):
    result = await db.execute(
        select(User).where(
            User.phone_number == phone_number
        )
    )

    return result.scalar_one_or_none()


# =========================================================
# CREATE USER
# =========================================================

async def create_user(
    db: AsyncSession,
    username: str,
    phone_number: str,
    password: str,
    role: str,
):
    user = User(
        username=username,
        phone_number=phone_number,
        password_hash=hash_password(password),
        role=role,
        is_active=True,
    )

    db.add(user)

    await db.commit()
    await db.refresh(user)

    return user


# =========================================================
# PRODUCER TRANSACTIONS
# =========================================================

async def get_transactions_by_producer(
    db: AsyncSession,
    producer: str,
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.producer == producer)
        .order_by(
            Transaction.created_at.desc()
        )
    )

    return [
        _transaction_response(transaction)
        for transaction in result.scalars().all()
    ]


# =========================================================
# CONSUMER TRANSACTIONS
# =========================================================

async def get_transactions_by_consumer(
    db: AsyncSession,
    consumer: str,
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.consumer == consumer)
        .order_by(
            Transaction.created_at.desc()
        )
    )

    return [
        _transaction_response(transaction)
        for transaction in result.scalars().all()
    ]


# =========================================================
# MARKET DATA
# =========================================================

async def get_market_data(
    db: AsyncSession,
    current_producer: str,
):
    result = await db.execute(
        select(Trading)
        .where(
            Trading.energy > 0,
            Trading.status == "Available",
            Trading.producer != current_producer,
        )
        .order_by(
            Trading.price.asc()
        )
    )

    listings = result.scalars().all()

    if not listings:
        return {
            "market_summary": {
                "lowest_price": 0,
                "highest_price": 0,
                "average_price": 0,
                "total_energy_available": 0,
                "active_listings": 0,
            },
            "listings": [],
        }

    prices = [
        float(listing.price)
        for listing in listings
    ]

    energies = [
        float(listing.energy)
        for listing in listings
    ]

    return {
        "market_summary": {
            "lowest_price": round(
                min(prices),
                2,
            ),
            "highest_price": round(
                max(prices),
                2,
            ),
            "average_price": round(
                sum(prices) / len(prices),
                2,
            ),
            "total_energy_available": round(
                sum(energies),
                2,
            ),
            "active_listings": len(listings),
        },
        "listings": [
            {
                "id": listing.id,
                "producer": listing.producer,
                "energy": round(
                    float(listing.energy),
                    2,
                ),
                "price": round(
                    float(listing.price),
                    2,
                ),
                "status": listing.status,
            }
            for listing in listings
        ],
    }


# =========================================================
# GET MARKET LISTINGS
# =========================================================

async def get_market_listings(
    db: AsyncSession,
    current_producer: str,
):
    result = await db.execute(
        select(Trading)
        .where(
            Trading.energy > 0,
            Trading.status == "Available",
            Trading.producer != current_producer,
        )
        .order_by(
            Trading.price.asc()
        )
    )

    return result.scalars().all()


# =========================================================
# ACCEPT NEGOTIATION
#
# Pending
#    ↓
# Producer accepts
#    ↓
# BuyRequest created
#    ↓
# Energy deducted
#    ↓
# Transaction created
#    ↓
# Negotiation accepted
# =========================================================

async def accept_negotiation(
    db: AsyncSession,
    negotiation_id: int,
):
    negotiation = await db.get(
        Negotiation,
        negotiation_id,
    )

    if negotiation is None:
        raise Exception(
            "Negotiation not found."
        )

    # Already rejected
    if negotiation.status == "Rejected":
        raise Exception(
            "Rejected negotiation cannot be accepted."
        )

    # Already accepted
    if negotiation.status == "Accepted":
        result = await db.execute(
            select(BuyRequest).where(
                BuyRequest.listing_id
                == negotiation.listing_id,
                BuyRequest.consumer
                == negotiation.consumer,
                BuyRequest.producer
                == negotiation.producer,
                BuyRequest.energy
                == negotiation.energy,
                BuyRequest.status
                == "Accepted",
            )
            .order_by(
                BuyRequest.id.desc()
            )
        )

        existing_request = (
            result.scalars().first()
        )

        if existing_request is not None:
            result = await db.execute(
                select(Transaction).where(
                    Transaction.producer == existing_request.producer,
                    Transaction.consumer == existing_request.consumer,
                )
            )

            existing_transaction = (
                result.scalars().first()
            )

            if existing_transaction is not None:
                return {
                    "message": (
                        "Negotiation is already accepted."
                    ),
                    "negotiation": negotiation,
                    "buy_request": existing_request,
                    "transaction": existing_transaction,
                }

        raise Exception(
            "Negotiation is already accepted."
        )

    if negotiation.status != "Pending":
        raise Exception(
            "Only pending negotiations can be accepted."
        )

    if negotiation.negotiated_price is None:
        raise Exception(
            "Negotiated price is not available."
        )

    # Find listing
    result = await db.execute(
        select(Trading).where(
            Trading.id == negotiation.listing_id
        )
    )

    listing = result.scalar_one_or_none()

    if listing is None:
        raise Exception(
            "Energy listing not found."
        )

    # Check energy
    if float(listing.energy) <= 0:
        raise Exception(
            "This energy listing is sold out."
        )

    if float(listing.energy) < float(
        negotiation.energy
    ):
        raise Exception(
            f"Only {listing.energy} kWh available."
        )

    # Final negotiated total
    total_amount = round(
        float(negotiation.energy)
        * float(negotiation.negotiated_price),
        2,
    )

    # Create BuyRequest only after producer accepts
    buy_request = BuyRequest(
        consumer=negotiation.consumer,
        producer=negotiation.producer,
        listing_id=negotiation.listing_id,
        energy=negotiation.energy,
        total_price=total_amount,
        status="Accepted",
    )

    db.add(buy_request)

    # Generate BuyRequest ID
    await db.flush()

    # Deduct energy
    listing.energy = round(
        float(listing.energy)
        - float(negotiation.energy),
        2,
    )

    if listing.energy <= 0:
        listing.energy = 0
        listing.status = "Sold Out"
    else:
        listing.status = "Available"

    # Accept negotiation
    negotiation.status = "Accepted"

    # Create transaction using negotiated price
    transaction = Transaction(
        producer=negotiation.producer,
        consumer=negotiation.consumer,
        listing_id=negotiation.listing_id,
        energy=negotiation.energy,
        price=negotiation.negotiated_price,
        total_amount=total_amount,
        status="Completed",
    )

    db.add(transaction)

    await db.commit()

    await db.refresh(negotiation)
    await db.refresh(buy_request)
    await db.refresh(listing)
    await db.refresh(transaction)

    return {
        "message": (
            "Negotiation accepted successfully."
        ),
        "negotiation": negotiation,
        "buy_request": buy_request,
        "transaction": transaction,
        "listing": listing,
    }


# =========================================================
# REJECT NEGOTIATION
# =========================================================

async def reject_negotiation(
    db: AsyncSession,
    negotiation_id: int,
):
    negotiation = await db.get(
        Negotiation,
        negotiation_id,
    )

    if negotiation is None:
        raise Exception(
            "Negotiation not found."
        )

    if negotiation.status == "Rejected":
        return {
            "message": (
                "Negotiation is already rejected."
            ),
            "negotiation": negotiation,
        }

    if negotiation.status == "Accepted":
        raise Exception(
            "Accepted negotiation cannot be rejected."
        )

    negotiation.status = "Rejected"

    await db.commit()
    await db.refresh(negotiation)

    return {
        "message": "Negotiation rejected.",
        "negotiation": negotiation,
    }


# =========================================================
# CREATE REVIEW
# =========================================================

async def create_review(
    db: AsyncSession,
    transaction_id: int,
    consumer: str,
    rating: int,
    comment: str | None = None,
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id
        )
    )

    transaction = result.scalar_one_or_none()

    if transaction is None:
        raise Exception(
            "Transaction not found."
        )

    if transaction.consumer != consumer:
        raise Exception(
            "You can review only your own purchases."
        )

    if transaction.status != "Completed":
        raise Exception(
            "Only completed transactions can be reviewed."
        )

    if rating < 1 or rating > 5:
        raise Exception(
            "Rating must be between 1 and 5."
        )

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
        comment=comment,
    )

    db.add(review)

    await db.commit()
    await db.refresh(review)

    return review


# =========================================================
# GET PRODUCER REVIEWS
# =========================================================

async def get_producer_reviews(
    db: AsyncSession,
    producer: str,
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
            "reviews": [],
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
            2,
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
                ),
            }
            for review in reviews
        ],
    }


# =========================================================
# GET SETTINGS
# =========================================================

async def get_settings(
    db: AsyncSession,
    username: str,
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise Exception(
            "User not found."
        )

    return {
        "username": user.username,
        "phone_number": user.phone_number,
        "role": user.role,
        "is_active": user.is_active,
        "default_selling_price": 0.0,
    }


# =========================================================
# UPDATE SETTINGS
# =========================================================

async def update_settings(
    db: AsyncSession,
    username: str,
    phone_number: str | None = None,
    default_selling_price: float | None = None,
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise Exception(
            "User not found."
        )

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
        ),
    }


# =========================================================
# CHANGE PASSWORD
# =========================================================

async def change_password(
    db: AsyncSession,
    username: str,
    current_password: str,
    new_password: str,
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise Exception(
            "User not found."
        )

    if not verify_password(
        current_password,
        user.password_hash,
    ):
        raise Exception(
            "Current password is incorrect."
        )

    if verify_password(
        new_password,
        user.password_hash,
    ):
        raise Exception(
            "New password must be different."
        )

    user.password_hash = hash_password(
        new_password
    )

    await db.commit()
    await db.refresh(user)

    return {
        "message": (
            "Password changed successfully."
        )
    }
