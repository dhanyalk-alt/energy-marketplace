"""Authenticated server-side weather proxy; API keys never reach React."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user
from app.external_data_service import ExternalDataError, get_weather


router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/forecast")
async def forecast(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    days: int = Query(7, ge=1, le=7),
    _user: dict = Depends(get_current_user),
):
    try:
        return await get_weather(latitude, longitude, days)
    except ExternalDataError as error:
        raise HTTPException(status_code=503, detail=str(error))
