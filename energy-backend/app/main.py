from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app import models

from app.routers import login, producer, consumer

app = FastAPI(
    title="Energy Marketplace API",
    version="1.0.0"
)

# -------------------------------
# Create Database Tables
# -------------------------------
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# -------------------------------
# Enable CORS
# -------------------------------
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


# -------------------------------
# Register Routers
# -------------------------------
app.include_router(login.router)
app.include_router(producer.router)
app.include_router(consumer.router)


# -------------------------------
# Home Route
# -------------------------------
@app.get("/")
async def root():
    return {
        "message": "Energy Marketplace Backend Running Successfully"
    }


# -------------------------------
# Health Check
# -------------------------------
@app.get("/health")
async def health():
    return {
        "status": "Running",
        "database": "Connected"
    }