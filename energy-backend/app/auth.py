from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException
from passlib.context import CryptContext


# =========================================================
# AUTHENTICATION CONFIGURATION
# =========================================================

import os

SECRET_KEY = os.getenv("ENERGY_MARKETPLACE_SECRET_KEY", "energy_marketplace_secret_key_2026")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# PASSWORD HASHING
# =========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# =========================================================
# HASH PASSWORD
# =========================================================

def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.
    """

    return pwd_context.hash(password)


# =========================================================
# VERIFY PASSWORD
# =========================================================

def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Check whether a plain password matches
    the stored password hash.
    """

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# =========================================================
# CREATE JWT ACCESS TOKEN
# =========================================================

def create_access_token(data: dict) -> str:
    """
    Create a JWT access token.

    The token expires after
    ACCESS_TOKEN_EXPIRE_MINUTES.
    """

    to_encode = data.copy()

    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {
            "exp": expire,
        }
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# =========================================================
# VERIFY JWT TOKEN
# =========================================================

def verify_token(token: str) -> dict:
    """
    Verify a JWT token and return its payload.

    Raises HTTP 401 if the token is invalid
    or expired.
    """

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except jwt.PyJWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


# =========================================================
# DECODE JWT ACCESS TOKEN
# =========================================================

def decode_access_token(
    token: str,
) -> dict | None:
    """
    Decode a JWT token.

    Returns:
        payload -> if valid
        None    -> if invalid/expired
    """

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except jwt.PyJWTError:

        return None