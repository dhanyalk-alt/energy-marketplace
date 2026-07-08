from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas import UserRegister, UserLogin, Token
from app.crud import get_user_by_username, create_user
from app.auth import verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ------------------------
# Register
# ------------------------
@router.post("/register")
async def register(
    user: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    existing_user = await get_user_by_username(db, user.username)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    new_user = await create_user(
        db=db,
        username=user.username,
        phone_number=user.phone_number,
        password=user.password,
        role=user.role
    )

    return {
        "message": "User registered successfully",
        "username": new_user.username,
        "role": new_user.role
    }


# ------------------------
# Login
# ------------------------
@router.post("/login", response_model=Token)
async def login(
    user: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    db_user = await get_user_by_username(db, user.username)

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username"
        )

    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    # Producer must login as Producer
    # Consumer must login as Consumer
    if db_user.role != user.role:
        raise HTTPException(
            status_code=403,
            detail=f"This account is registered as {db_user.role}"
        )

    token = create_access_token(
        {
            "sub": db_user.username,
            "role": db_user.role
        }
    )

    return {
    "access_token": token,
    "token_type": "bearer",
    "role": user.role
}