from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# This project already uses PostgreSQL. Do not silently switch to SQLite: that
# requires an additional driver and starts the application with an empty,
# different database. Deployments may override this through DATABASE_URL.
DATABASE_URL = "postgresql+asyncpg://postgres:xxxxxxxxx/energyLogin_db"

# Create Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"timeout": 10},
    pool_pre_ping=True,
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
