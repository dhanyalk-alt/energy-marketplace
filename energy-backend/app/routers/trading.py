from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import TradingCreate, BuyRequestCreate

from app.crud import (
    create_trading,
    get_all_trading,
    buy_energy,
    get_requests,
    accept_request,
    reject_request
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


from fastapi import HTTPException

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
    return await accept_request(db, id)


# -----------------------------
# Reject Buy Request
# -----------------------------
@router.put("/reject/{id}")
async def reject(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    return await reject_request(db, id)