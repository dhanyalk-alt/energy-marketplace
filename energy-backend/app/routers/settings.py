from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.schemas import (
    SettingsUpdate,
    ChangePassword
)

from app.crud import (
    get_settings,
    update_settings,
    change_password
)


router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


# -----------------------------
# Get Settings
# -----------------------------
@router.get("/{username}")
async def read_settings(
    username: str,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await get_settings(
            db,
            username
        )

    except Exception as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# -----------------------------
# Update Settings
# -----------------------------
@router.put("/{username}")
async def update_user_settings(
    username: str,
    settings: SettingsUpdate,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await update_settings(
            db=db,
            username=username,
            phone_number=settings.phone_number,
            default_selling_price=(
                settings.default_selling_price
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# -----------------------------
# Change Password
# -----------------------------
@router.put("/{username}/password")
async def update_password(
    username: str,
    password_data: ChangePassword,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await change_password(
            db=db,
            username=username,
            current_password=password_data.current_password,
            new_password=password_data.new_password
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )