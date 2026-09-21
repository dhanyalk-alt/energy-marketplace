from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import ProducerInsightsRequest
from app.services.producer_insights_service import get_producer_insights


router = APIRouter(prefix="/producer", tags=["Producer Insights"])


@router.post("/insights")
async def producer_insights(
    request: ProducerInsightsRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "producer" or not user.get("sub"):
        raise HTTPException(status_code=403, detail="Only producers can view producer insights.")

    return await get_producer_insights(
        db=db,
        producer=user["sub"],
        weather=request.weather,
    )
