from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user

from app.services.negotiation_service import (
    calculate_negotiation_price,
)

from app.battery_service import (
    get_available_battery_energy,
)

from app.schemas import (
    TradingCreate,
    BuyRequestCreate,
    TransactionResponse,
    ReviewCreate,
    ReviewResponse,
    NegotiationCreate,
    NegotiationResponse,
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
    get_producer_reviews,
    get_trading_listing,
    get_negotiations_by_producer,
    accept_negotiation,
    reject_negotiation,
)

from app.models import (
    Negotiation,
    Trading,
    BuyRequest,
    Transaction,
)


router = APIRouter(
    prefix="/trading",
    tags=["Trading"],
)


# =========================================================
# TEST API
# =========================================================

@router.get("/")
async def test():
    return {
        "message": "Trading API is working"
    }


# =========================================================
# ADD TRADING LISTING
# =========================================================

@router.post("/add")
async def add_trading(
    trade: TradingCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        new_trade = await create_trading(
            db=db,
            producer=trade.producer,
            energy=trade.energy,
            price=trade.price,
        )

        return new_trade

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# GET ALL LISTINGS
# =========================================================

@router.get("/all")
async def get_all(
    db: AsyncSession = Depends(get_db),
):
    return await get_all_trading(db)


# =========================================================
# BUY ENERGY
# =========================================================

@router.post("/buy/{id}")
async def buy_listing(
    id: int,
    request: BuyRequestCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await buy_energy(
            db=db,
            listing_id=id,
            consumer=request.consumer,
            energy=request.energy,
            reason=request.reason,
            urgency=request.urgency,
        )

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Energy listing not found.",
            )

        return result

    except HTTPException:
        raise

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# PRODUCER MARKET
# =========================================================

@router.get("/market/{username}")
async def producer_market(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await get_market_data(
            db,
            username,
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# GET ALL BUY REQUESTS
# =========================================================

@router.get("/requests")
async def view_requests(
    db: AsyncSession = Depends(get_db),
):
    return await get_requests(db)


# =========================================================
# GET CONSUMER BUY REQUESTS
# =========================================================

@router.get("/requests/consumer/{username}")
async def consumer_buy_requests(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(BuyRequest)
            .where(
                BuyRequest.consumer == username
            )
            .order_by(
                BuyRequest.id.desc()
            )
        )

        return result.scalars().all()

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# ACCEPT NORMAL BUY REQUEST
# =========================================================

@router.put("/accept/{id}")
async def accept(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await accept_request(
            db,
            id,
        )

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Buy request not found.",
            )

        return result

    except HTTPException:
        raise

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# REJECT NORMAL BUY REQUEST
# =========================================================

@router.put("/reject/{id}")
async def reject(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await reject_request(
            db,
            id,
        )

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Buy request not found.",
            )

        return result

    except HTTPException:
        raise

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# PRODUCER TRANSACTIONS
# =========================================================

@router.get(
    "/transactions/producer/{username}",
    response_model=list[TransactionResponse],
)
async def producer_transactions(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    return await get_transactions_by_producer(
        db,
        username,
    )


# =========================================================
# CONSUMER TRANSACTIONS
# =========================================================

@router.get(
    "/transactions/consumer/{username}",
    response_model=list[TransactionResponse],
)
async def consumer_transactions(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    return await get_transactions_by_consumer(
        db,
        username,
    )


# =========================================================
# GET NEGOTIATIONS BY PRODUCER
# =========================================================

@router.get(
    "/negotiations/producer/{username}"
)
async def producer_negotiations(
    username: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    try:
        if user.get("sub") != username and user.get("role") != "producer":
            raise HTTPException(
                status_code=403,
                detail="You can only view your own negotiations.",
            )
        return await get_negotiations_by_producer(
            db,
            username,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.get(
    "/negotiations/consumer/{username}"
)
async def consumer_negotiations(
    username: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    try:
        if user.get("sub") != username:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own negotiations.",
            )

        result = await db.execute(
            select(Negotiation)
            .where(
                Negotiation.consumer == username,
            )
            .order_by(
                Negotiation.id.desc(),
            )
        )
        return result.scalars().all()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# AI NEGOTIATION
# =========================================================
#
# Consumer sends:
#
# listing_id
# consumer
# energy
# consumer_offer
#
# AI calculates:
#
# producer price
# market price
# available energy
#
# Result:
#
# Accepted
# Counter Offer
# Rejected
#
# IMPORTANT:
#
# At this stage NO transaction is created.
#


@router.post(
    "/negotiate",
    response_model=NegotiationResponse,
)
async def negotiate_energy(
    negotiation: NegotiationCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    try:
        if user.get("sub") != negotiation.consumer:
            raise HTTPException(
                status_code=403,
                detail="You can only create negotiations as the authenticated consumer.",
            )

        listing = await get_trading_listing(
            db,
            negotiation.listing_id,
        )

        if listing is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    "The selected energy listing "
                    "does not exist or is no longer available."
                ),
            )

        producer = listing.producer
        producer_price = float(listing.price)
        available_listing_energy = float(listing.energy)

        if negotiation.energy <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Requested energy must be "
                    "greater than 0."
                ),
            )

        if negotiation.consumer_offer <= 0:
            raise HTTPException(
                status_code=400,
                detail="Offer price must be greater than 0.",
            )

        if negotiation.energy > available_listing_energy:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Requested energy is greater "
                    "than the energy available "
                    "in this listing."
                ),
            )

        if negotiation.consumer_offer > producer_price:
            raise HTTPException(
                status_code=400,
                detail="Consumer offer cannot exceed the producer price.",
            )

        market_data = await get_market_data(
            db,
            producer,
        )

        market_summary = market_data.get(
            "market_summary",
            {},
        )

        market_price = float(
            market_summary.get(
                "average_price",
                0,
            )
        )

        if market_price <= 0:
            market_price = producer_price

        battery_data = get_available_battery_energy()
        available_battery_energy = float(
            battery_data.get(
                "available_energy_kwh",
                0,
            )
        )

        if available_battery_energy > 0:
            available_energy = min(
                available_listing_energy,
                available_battery_energy,
            )
        else:
            available_energy = available_listing_energy

        result = calculate_negotiation_price(
            producer_price=producer_price,
            consumer_offer=float(negotiation.consumer_offer),
            market_price=market_price,
            available_energy=available_energy,
            requested_energy=float(negotiation.energy),
        )

        negotiated_price = result.get("negotiated_price")
        if negotiated_price is None:
            raise HTTPException(
                status_code=400,
                detail=result.get("reason", "Negotiation could not be created."),
            )

        if not (float(negotiation.consumer_offer) <= float(negotiated_price) <= producer_price):
            negotiated_price = round(max(float(negotiation.consumer_offer), min(float(negotiated_price), producer_price)), 2)

        # A below-ask offer needs the consumer to explicitly accept the
        # calculated counter offer. Only that acceptance changes the state
        # to Pending, where it waits for the producer's final decision.
        # The calculated price is always presented to the consumer first.
        # Only an explicit consumer approval creates the pending buy request
        # that the producer can accept or reject.
        initial_status = "Counter Offer"

        new_negotiation = Negotiation(
            listing_id=negotiation.listing_id,
            producer=producer,
            consumer=negotiation.consumer,
            energy=negotiation.energy,
            producer_price=producer_price,
            consumer_offer=float(negotiation.consumer_offer),
            negotiated_price=negotiated_price,
            status=initial_status,
            reason=negotiation.reason,
            urgency=negotiation.urgency,
        )

        db.add(new_negotiation)
        await db.commit()
        await db.refresh(new_negotiation)

        return new_negotiation

    except HTTPException:

        await db.rollback()

        raise

    except Exception as e:

        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# CONSUMER ACCEPTS AI COUNTER OFFER
# =========================================================
#
# IMPORTANT CHANGE
#
# Consumer acceptance does NOT create a transaction.
#
# Instead:
#
# Negotiation
#      ↓
# status = Pending
#      ↓
# BuyRequest = Pending
#      ↓
# Producer sees request
#
# Producer must make the final decision.
#


@router.put(
    "/negotiate/{negotiation_id}/accept"
)
async def consumer_accept_negotiation(
    negotiation_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    try:

        # -------------------------------------------------
        # 1. FIND NEGOTIATION
        # -------------------------------------------------

        negotiation = await db.get(
            Negotiation,
            negotiation_id,
        )

        if negotiation is None:
            raise HTTPException(
                status_code=404,
                detail="Negotiation not found.",
            )

        if user.get("sub") != negotiation.consumer:
            raise HTTPException(
                status_code=403,
                detail="Only the consumer who created this negotiation can accept it.",
            )

        # -------------------------------------------------
        # 2. CHECK CURRENT STATUS
        # -------------------------------------------------

        if negotiation.status == "Accepted":

            raise HTTPException(
                status_code=400,
                detail=(
                    "This negotiation has already "
                    "been accepted by the producer."
                ),
            )

        if negotiation.status == "Pending":
            result = await db.execute(
                select(BuyRequest)
                .where(
                    BuyRequest.listing_id == negotiation.listing_id,
                    BuyRequest.consumer == negotiation.consumer,
                    BuyRequest.producer == negotiation.producer,
                    BuyRequest.energy == negotiation.energy,
                    BuyRequest.status == "Pending",
                )
                .order_by(BuyRequest.id.desc())
            )
            existing_request = result.scalars().first()

            return {
                "message": (
                    "Negotiation request is already "
                    "waiting for producer approval."
                ),
                "negotiation_id": negotiation.id,
                "buy_request_id": (
                    existing_request.id if existing_request else None
                ),
                "status": negotiation.status,
            }

        if negotiation.status == "Rejected":

            raise HTTPException(
                status_code=400,
                detail=(
                    "Rejected negotiation cannot "
                    "be accepted."
                ),
            )

        if negotiation.status != "Counter Offer":

            raise HTTPException(
                status_code=400,
                detail=(
                    "Only a Counter Offer can "
                    "be accepted by the consumer."
                ),
            )

        # -------------------------------------------------
        # 3. CHECK NEGOTIATED PRICE
        # -------------------------------------------------

        if negotiation.negotiated_price is None:

            raise HTTPException(
                status_code=400,
                detail=(
                    "No negotiated price is available."
                ),
            )

        # -------------------------------------------------
        # 4. FIND LISTING
        # -------------------------------------------------

        result = await db.execute(
            select(Trading).where(
                Trading.id
                == negotiation.listing_id
            )
        )

        listing = (
            result.scalar_one_or_none()
        )

        if listing is None:
            raise HTTPException(
                status_code=404,
                detail="Energy listing not found.",
            )

        # -------------------------------------------------
        # 5. CHECK ENERGY
        # -------------------------------------------------

        if listing.energy <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "This energy listing is sold out."
                ),
            )

        if (
            float(listing.energy)
            < float(negotiation.energy)
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Only {listing.energy} kWh "
                    f"is available."
                ),
            )

        # -------------------------------------------------
        # 6. CALCULATE TOTAL
        # -------------------------------------------------

        total_amount = round(
            float(negotiation.energy)
            * float(negotiation.negotiated_price),
            2,
        )

        # -------------------------------------------------
        # 7. CHECK EXISTING PENDING REQUEST
        # -------------------------------------------------

        result = await db.execute(
            select(BuyRequest)
            .where(
                BuyRequest.listing_id
                == negotiation.listing_id,

                BuyRequest.consumer
                == negotiation.consumer,

                BuyRequest.producer
                == negotiation.producer,

                BuyRequest.energy
                == negotiation.energy,

                BuyRequest.total_price
                == total_amount,

                BuyRequest.status
                == "Pending",
            )
            .order_by(
                BuyRequest.id.desc()
            )
        )

        existing_request = (
            result.scalars().first()
        )

        # -------------------------------------------------
        # 8. CREATE BUY REQUEST
        # -------------------------------------------------

        if existing_request is None:

            buy_request = BuyRequest(
                consumer=negotiation.consumer,

                producer=negotiation.producer,

                listing_id=negotiation.listing_id,

                energy=negotiation.energy,

                total_price=total_amount,

                status="Pending",
                reason=negotiation.reason,
                urgency=negotiation.urgency,
                offered_price=negotiation.negotiated_price,
            )

            db.add(
                buy_request
            )

            await db.flush()

        else:

            buy_request = existing_request

            buy_request.total_price = (
                total_amount
            )

        # -------------------------------------------------
        # 9. IMPORTANT:
        #
        # DO NOT DEDUCT ENERGY HERE.
        #
        # Producer has not accepted yet.
        # -------------------------------------------------

        negotiation.status = "Pending"

        # -------------------------------------------------
        # 10. SAVE
        # -------------------------------------------------

        await db.commit()

        await db.refresh(
            negotiation
        )

        await db.refresh(
            buy_request
        )

        # -------------------------------------------------
        # 11. RETURN TO CONSUMER
        # -------------------------------------------------

        return {
            "message": (
                "Counter offer accepted. "
                "Waiting for producer approval."
            ),

            "negotiation_id": (
                negotiation.id
            ),

            "buy_request_id": (
                buy_request.id
            ),

            "producer": (
                negotiation.producer
            ),

            "consumer": (
                negotiation.consumer
            ),

            "energy": (
                negotiation.energy
            ),

            "negotiated_price": (
                negotiation.negotiated_price
            ),

            "total_amount": (
                total_amount
            ),

            "status": (
                "Pending"
            ),
        }

    except HTTPException:

        await db.rollback()

        raise

    except Exception as e:

        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# CONSUMER REJECTS AI COUNTER OFFER
# =========================================================

@router.put(
    "/negotiate/{negotiation_id}/consumer-reject"
)
async def consumer_reject_negotiation(
    negotiation_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    try:
        negotiation = await db.get(Negotiation, negotiation_id)

        if negotiation is None:
            raise HTTPException(
                status_code=404,
                detail="Negotiation not found.",
            )

        if user.get("sub") != negotiation.consumer:
            raise HTTPException(
                status_code=403,
                detail="Only the consumer who created this negotiation can reject it.",
            )

        if negotiation.status == "Rejected":
            return {
                "message": "Negotiation is already rejected.",
                "negotiation_id": negotiation.id,
                "status": negotiation.status,
            }

        if negotiation.status != "Counter Offer":
            raise HTTPException(
                status_code=400,
                detail="Only a Counter Offer can be rejected by the consumer.",
            )

        negotiation.status = "Rejected"
        await db.commit()
        await db.refresh(negotiation)

        return {
            "message": "Counter offer rejected.",
            "negotiation_id": negotiation.id,
            "status": negotiation.status,
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# PRODUCER ACCEPTS NEGOTIATION
#
# FINAL FLOW:
#
# Pending Negotiation
#       ↓
# Producer Accept
#       ↓
# Create BuyRequest
#       ↓
# Deduct Energy
#       ↓
# Create Transaction
#       ↓
# Negotiation = Accepted
#
# =========================================================

@router.put(
    "/negotiate/{negotiation_id}/producer-accept"
)
async def producer_accept_negotiation(
    negotiation_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    try:
        negotiation = await db.get(Negotiation, negotiation_id)

        if negotiation is None:
            raise HTTPException(status_code=404, detail="Negotiation not found.")

        if not user.get("sub") or user.get("sub") != negotiation.producer:
            raise HTTPException(status_code=403, detail="Only the producer can accept this negotiation.")

        if negotiation.status == "Accepted":
            result = await db.execute(
                select(Transaction)
                .join(BuyRequest, Transaction.request_id == BuyRequest.id)
                .where(
                    BuyRequest.listing_id == negotiation.listing_id,
                    BuyRequest.consumer == negotiation.consumer,
                    BuyRequest.producer == negotiation.producer,
                    BuyRequest.energy == negotiation.energy,
                )
                .order_by(Transaction.id.desc())
            )
            existing_transaction = result.scalars().first()
            if existing_transaction is not None:
                return {
                    "message": "Negotiation is already accepted.",
                    "negotiation_id": negotiation.id,
                    "transaction_id": existing_transaction.id,
                    "status": "Accepted",
                }
            raise HTTPException(status_code=400, detail="Negotiation is already accepted but its transaction was not found.")

        if negotiation.status == "Rejected":
            raise HTTPException(status_code=400, detail="Rejected negotiation cannot be accepted.")

        if negotiation.status != "Pending":
            raise HTTPException(status_code=400, detail="Only a Pending negotiation can be accepted by the producer.")

        if negotiation.negotiated_price is None:
            raise HTTPException(status_code=400, detail="Negotiated price is not available.")

        result = await db.execute(select(Trading).where(Trading.id == negotiation.listing_id))
        listing = result.scalar_one_or_none()
        if listing is None:
            raise HTTPException(status_code=404, detail="Trading listing not found.")

        if float(listing.energy) <= 0:
            raise HTTPException(status_code=400, detail="This energy listing is sold out.")
        if float(listing.energy) < float(negotiation.energy):
            raise HTTPException(status_code=400, detail=f"Only {listing.energy} kWh is available.")

        total_amount = round(float(negotiation.energy) * float(negotiation.negotiated_price), 2)

        buy_request = BuyRequest(
            consumer=negotiation.consumer,
            producer=negotiation.producer,
            listing_id=negotiation.listing_id,
            energy=negotiation.energy,
            total_price=total_amount,
            status="Accepted",
        )
        db.add(buy_request)
        await db.flush()

        listing.energy = round(float(listing.energy) - float(negotiation.energy), 2)
        if listing.energy <= 0:
            listing.energy = 0
            listing.status = "Sold Out"
        else:
            listing.status = "Available"

        negotiation.status = "Accepted"

        transaction = Transaction(
            producer=negotiation.producer,
            consumer=negotiation.consumer,
            listing_id=negotiation.listing_id,
            request_id=buy_request.id,
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
            "message": "Negotiation accepted. Transaction created successfully.",
            "negotiation_id": negotiation.id,
            "buy_request_id": buy_request.id,
            "transaction_id": transaction.id,
            "producer": negotiation.producer,
            "consumer": negotiation.consumer,
            "energy": negotiation.energy,
            "producer_price": negotiation.producer_price,
            "consumer_offer": negotiation.consumer_offer,
            "negotiated_price": negotiation.negotiated_price,
            "total_amount": total_amount,
            "remaining_energy": listing.energy,
            "listing_status": listing.status,
            "status": negotiation.status,
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))



# =========================================================
# PRODUCER REJECTS NEGOTIATION
# =========================================================


@router.put(
    "/negotiate/{negotiation_id}/producer-reject"
)
async def producer_reject_negotiation(
    negotiation_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    try:
        negotiation = await db.get(Negotiation, negotiation_id)

        if negotiation is None:
            raise HTTPException(status_code=404, detail="Negotiation not found.")

        if not user.get("sub") or user.get("sub") != negotiation.producer:
            raise HTTPException(status_code=403, detail="Only the producer can reject this negotiation.")

        if negotiation.status == "Rejected":
            return {
                "message": "Negotiation is already rejected.",
                "negotiation_id": negotiation.id,
                "status": "Rejected",
            }

        if negotiation.status == "Accepted":
            raise HTTPException(status_code=400, detail="Accepted negotiation cannot be rejected.")

        result = await db.execute(
            select(BuyRequest)
            .where(
                BuyRequest.listing_id == negotiation.listing_id,
                BuyRequest.consumer == negotiation.consumer,
                BuyRequest.producer == negotiation.producer,
                BuyRequest.energy == negotiation.energy,
                BuyRequest.status == "Pending",
            )
            .order_by(BuyRequest.id.desc())
        )
        buy_request = result.scalars().first()

        negotiation.status = "Rejected"
        if buy_request is not None:
            buy_request.status = "Rejected"

        await db.commit()
        await db.refresh(negotiation)
        if buy_request is not None:
            await db.refresh(buy_request)

        return {
            "message": "Negotiation rejected.",
            "negotiation_id": negotiation.id,
            "buy_request_id": buy_request.id if buy_request is not None else None,
            "producer": negotiation.producer,
            "consumer": negotiation.consumer,
            "energy": negotiation.energy,
            "negotiated_price": negotiation.negotiated_price,
            "status": negotiation.status,
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# =========================================================
# CREATE REVIEW
# =========================================================

@router.post(
    "/review",
    response_model=ReviewResponse,
)
async def submit_review(
    review: ReviewCreate,
    consumer: str,
    db: AsyncSession = Depends(get_db),
):
    try:

        new_review = await create_review(

            db=db,

            transaction_id=(
                review.transaction_id
            ),

            consumer=consumer,

            rating=(
                review.rating
            ),

            comment=(
                review.comment
            ),
        )

        return new_review

    except Exception as e:

        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# GET PRODUCER REVIEWS
# =========================================================

@router.get(
    "/reviews/{producer}"
)
async def producer_reviews(
    producer: str,
    db: AsyncSession = Depends(get_db),
):
    return await get_producer_reviews(
        db,
        producer,
    )
