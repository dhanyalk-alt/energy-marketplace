from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.schemas import (
    TradingCreate,
    BuyRequestCreate,
    TransactionResponse,
    ReviewCreate,
    ReviewResponse
)

from app.crud import (
    create_trading,
    get_all_trading,
    buy_energy,
    get_requests,
    accept_request,
    reject_request,
    get_transactions_by_producer,
    get_transactions_by_consumer,
    get_market_data,
    create_review,
    get_producer_reviews
)


router = APIRouter(
    prefix="/trading",
    tags=["Trading"]
)


# -----------------------------
# Test API
# -----------------------------
@router.get("/")
async def test():

    return {
        "message": "Trading API is working"
    }


# -----------------------------
# Add a new energy listing
# -----------------------------
@router.post("/add")
async def add_trading(
    trade: TradingCreate,
    db: AsyncSession = Depends(get_db)
):

    new_trade = await create_trading(
        db,
        producer=trade.producer,
        energy=trade.energy,
        price=trade.price
    )

    return new_trade


# -----------------------------
# Get all listings
# -----------------------------
@router.get("/all")
async def get_all(
    db: AsyncSession = Depends(get_db)
):

    return await get_all_trading(db)


# -----------------------------
# Buy Energy
# -----------------------------
@router.post("/buy/{id}")
async def buy_listing(
    id: int,
    request: BuyRequestCreate,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await buy_energy(
            db,
            id,
            request.consumer,
            request.energy
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# -----------------------------
# Producer Market Insights
# -----------------------------
@router.get("/market/{username}")
async def producer_market(
    username: str,
    db: AsyncSession = Depends(get_db)
):

    return await get_market_data(
        db,
        username
    )


# -----------------------------
# View Buy Requests
# -----------------------------
@router.get("/requests")
async def view_requests(
    db: AsyncSession = Depends(get_db)
):

    return await get_requests(db)


# -----------------------------
# Accept Buy Request
# -----------------------------
@router.put("/accept/{id}")
async def accept(
    id: int,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await accept_request(
            db,
            id
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# -----------------------------
# Reject Buy Request
# -----------------------------
@router.put("/reject/{id}")
async def reject(
    id: int,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await reject_request(
            db,
            id
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# -----------------------------
# Producer Transactions
# -----------------------------
@router.get(
    "/transactions/producer/{username}",
    response_model=list[TransactionResponse]
)
async def producer_transactions(
    username: str,
    db: AsyncSession = Depends(get_db)
):

    return await get_transactions_by_producer(
        db,
        username
    )


# -----------------------------
# Consumer Transactions
# -----------------------------
@router.get(
    "/transactions/consumer/{username}",
    response_model=list[TransactionResponse]
)
async def consumer_transactions(
    username: str,
    db: AsyncSession = Depends(get_db)
):

    return await get_transactions_by_consumer(
        db,
        username
    )


# =========================================================
# REVIEWS
# =========================================================


# -----------------------------
# Create Review
# -----------------------------
@router.post(
    "/review",
    response_model=ReviewResponse
)
async def submit_review(
    review: ReviewCreate,
    consumer: str,
    db: AsyncSession = Depends(get_db)
):

    try:

        new_review = await create_review(
            db=db,
            transaction_id=review.transaction_id,
            consumer=consumer,
            rating=review.rating,
            comment=review.comment
        )

        return new_review

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# -----------------------------
# Get Producer Reviews
# -----------------------------
@router.get(
    "/reviews/{producer}"
)
async def producer_reviews(
    producer: str,
    db: AsyncSession = Depends(get_db)
):

    return await get_producer_reviews(
        db,
        producer
    )