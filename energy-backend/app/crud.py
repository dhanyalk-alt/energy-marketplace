from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.auth import hash_password


# Get user by username
async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(
        select(User).where(User.username == username)
    )
    return result.scalar_one_or_none()


# Get user by phone number
async def get_user_by_phone(db: AsyncSession, phone_number: str):
    result = await db.execute(
        select(User).where(User.phone_number == phone_number)
    )
    return result.scalar_one_or_none()


# Create a new user
async def create_user(
    db: AsyncSession,
    username: str,
    phone_number: str,
    password: str,
    role: str
):
    user = User(
        username=username,
        phone_number=phone_number,
        password_hash=hash_password(password),
        role=role,
        is_active=True
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user