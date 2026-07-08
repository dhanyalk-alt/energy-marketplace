from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/consumer",
    tags=["Consumer"]
)


@router.get("/dashboard")
async def consumer_dashboard(
    user=Depends(get_current_user)
):
    return {
        "message": f"Welcome {user['name']} to Consumer Dashboard"
    }


@router.get("/buy-energy")
async def buy_energy():
    return {
        "message": "Buy Energy Page"
    }


@router.get("/purchase-history")
async def purchase_history():
    return {
        "message": "Purchase History"
    }