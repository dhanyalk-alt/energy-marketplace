from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+asyncpg://postgres:12345@localhost:5436/energy_marketplace"

# Create Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True
)

# Create Session
SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base Class
Base = declarative_base()

# Dependency
async def get_db():
    async with SessionLocal() as session:
        yield session