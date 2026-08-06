from fastapi import APIRouter, HTTPException

from app.market_service import (
    get_market_records,
    get_latest_market_record,
    get_market_summary
)


router = APIRouter(
    prefix="/market",
    tags=["Market"]
)


# ============================================================
# ALL IEX MARKET DATA
# ============================================================

@router.get("/iex")
async def get_iex_market_data():

    try:

        records = get_market_records()

        return {
            "source": "IEX",
            "records": records
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# LATEST IEX MARKET DATA
# ============================================================

@router.get("/iex/latest")
async def get_latest_iex_market():

    try:

        record = get_latest_market_record()

        if record is None:

            raise HTTPException(
                status_code=404,
                detail="No IEX market data available."
            )

        return {
            "source": "IEX",
            "record": record
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# IEX MARKET SUMMARY
# ============================================================

@router.get("/iex/summary")
async def get_iex_market_summary():

    try:

        summary = get_market_summary()

        if summary is None:

            raise HTTPException(
                status_code=404,
                detail="No IEX market data available."
            )

        return {
            "source": "IEX",
            "summary": summary
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )