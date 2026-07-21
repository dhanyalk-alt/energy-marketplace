from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

<<<<<<< HEAD
DATABASE_URL = "postgresql+asyncpg://postgres:123456789@localhost:5432/energyLogin_db"
=======
DATABASE_URL = "postgresql+asyncpg://postgres:xxxxxxxxxxxxx@localhost:5432/energyLogin_db"
>>>>>>> 0f25f6b47cc93e5d9032f16bc8190931d08c5d1d

engine = create_async_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()