import asyncio

from sqlalchemy import text
from app.database import engine


async def migrate():

    async with engine.begin() as connection:

        await connection.execute(
            text(
                """
                ALTER TABLE transactions
                ALTER COLUMN request_id DROP NOT NULL
                """
            )
        )

    print("Database migration completed successfully.")


if __name__ == "__main__":
    asyncio.run(migrate())