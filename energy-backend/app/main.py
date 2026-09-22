import asyncio

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.routers.market import router as market_router

from app.database import engine, Base
from app import models

from app.routers import (
    login,
    producer,
    consumer,
    trading,
    settings
)
from app.routers.assistant import router as assistant_router
from app.routers.producer_insights import router as producer_insights_router

from app.battery_router import router as battery_router
from app.ai_config import validate_openai_configuration


# Create FastAPI app
app = FastAPI(
    title="Energy Marketplace API",
    version="1.0.0"
)


# --------------------------------
# Startup
# --------------------------------
@app.on_event("startup")
async def startup():

    validate_openai_configuration()

    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all
        )

        # PostgreSQL migration statements are idempotent. They retain existing
        # data and complete quickly when the columns already exist.
        await conn.execute(text("ALTER TABLE buy_requests ADD COLUMN IF NOT EXISTS reason VARCHAR(500)"))
        await conn.execute(text("ALTER TABLE buy_requests ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) NOT NULL DEFAULT 'Normal'"))
        await conn.execute(text("ALTER TABLE buy_requests ADD COLUMN IF NOT EXISTS offered_price DOUBLE PRECISION"))
        await conn.execute(text("ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS reason VARCHAR(500)"))
        await conn.execute(text("ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) NOT NULL DEFAULT 'Normal'"))


# --------------------------------
# CORS
# --------------------------------
app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# --------------------------------
# Register Routers
# --------------------------------

app.include_router(
    login.router
)

app.include_router(
    producer.router
)

app.include_router(
    consumer.router
)

app.include_router(
    trading.router
)

app.include_router(
    settings.router
)

app.include_router(
    battery_router
)

app.include_router(
    market_router
)


@app.middleware("http")
async def enforce_request_timeout(
    request: Request,
    call_next,
):
    try:
        return await asyncio.wait_for(
            call_next(request),
            timeout=25,
        )
    except TimeoutError:
        return JSONResponse(
            status_code=504,
            content={
                "detail": "The request exceeded the 25-second limit."
            },
        )

app.include_router(
    assistant_router
)

app.include_router(
    producer_insights_router
)


# --------------------------------
# Home
# --------------------------------
@app.get("/")
async def root():

    return {
        "message":
        "Energy Marketplace Backend Running Successfully"
    }


# --------------------------------
# Health
# --------------------------------
@app.get("/health")
async def health():

    return {
        "status": "Running",
        "database": "Connected"
    }
