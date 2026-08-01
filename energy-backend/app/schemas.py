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


# ---------- Trading ----------

class TradingCreate(BaseModel):
    producer: str
    energy: float
    price: float


class TradingResponse(BaseModel):
    id: int
    producer: str
    energy: float
    price: float
    status: str

    class Config:
        from_attributes = True


# ---------- Buy Request ----------

class BuyRequestCreate(BaseModel):
    consumer: str
    energy: float


class BuyRequestResponse(BaseModel):
    id: int
    consumer: str
    producer: str
    energy: float
    total_price: float
    status: str

    class Config:
        from_attributes = True