from app.database import SessionLocal
from fastapi import Header, HTTPException
from app.auth import verify_token

async def get_current_user(
    authorization: str = Header(None)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Token missing"
        )

    token = authorization.replace("Bearer ", "")
    return verify_token(token)
async def get_db():
    async with SessionLocal() as session:
        yield session