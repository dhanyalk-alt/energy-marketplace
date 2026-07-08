from pydantic import BaseModel, Field
from typing import Literal


# ---------- Register ----------

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    phone_number: str
    password: str = Field(..., min_length=6)
    role: Literal["producer", "consumer"]


# ---------- Login ----------

class UserLogin(BaseModel):
    username: str
    password: str
    role: Literal["producer", "consumer"]


# ---------- User Response ----------

class UserResponse(BaseModel):
    id: int
    username: str
    phone_number: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


# ---------- JWT ----------

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: str | None = None