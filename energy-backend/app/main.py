from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

from app.battery_router import router as battery_router


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

    async with engine.begin() as conn:

        await conn.run_sync(
            Base.metadata.create_all
        )


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