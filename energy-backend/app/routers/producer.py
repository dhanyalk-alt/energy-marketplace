from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
router = APIRouter(
    prefix="/producer",
    tags=["Producer"]
)


@router.get("/dashboard")
async def producer_dashboard(
    user=Depends(get_current_user)
):
    if user["role"] != "producer":
        raise HTTPException(
            status_code=403,
            detail="Only producers can access this page"
        )
    return {
        "message": f"Welcome {user['name']} to Producer Dashboard"
    }


@router.get("/energy")
async def energy_production():
    return {
        "message": "Producer Energy Data"
    }


@router.get("/transactions")
async def transactions():
    return {
        "message": "Producer Transaction History"
    }


@router.post("/switch-to-consumer")
async def switch_to_consumer(
    user=Depends(get_current_user)
):
    if user["role"] != "producer":
        raise HTTPException(
            status_code=403,
            detail="Only producers can switch"
        )

    return {
        "message": "Switched to Consumer Mode"
    }