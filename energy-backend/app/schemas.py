from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


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
    reason: str = Field(..., min_length=3, max_length=500)
    urgency: Literal["Critical", "Essential", "Normal", "Flexible"] = "Normal"


class BuyRequestResponse(BaseModel):
    id: int
    consumer: str
    producer: str
    energy: float
    total_price: float
    status: str
    reason: str | None = None
    urgency: str = "Normal"
    offered_price: float | None = None

    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: int
    producer: str
    consumer: str
    listing_id: int | None = None
    # The existing transactions table has no request_id column. Retain this
    # response key for frontend compatibility.
    request_id: int | None = None
    energy: float
    price: float
    total_amount: float
    status: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True

# ---------- Reviews ----------

class ReviewCreate(BaseModel):
    transaction_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: int
    producer: str
    consumer: str
    transaction_id: int
    rating: int
    comment: str | None
    created_at: datetime

    class Config:
        from_attributes = True

# ---------- Producer Settings ----------

class SettingsResponse(BaseModel):
    username: str
    phone_number: str
    role: str
    is_active: bool
    default_selling_price: float = 0.0

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    phone_number: str | None = None
    default_selling_price: float | None = Field(
        default=None,
        ge=0
    )


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(
        ...,
        min_length=6
    )
# ---------- AI Negotiation ----------

class NegotiationCreate(BaseModel):
    listing_id: int
    consumer: str
    energy: float = Field(..., gt=0)
    consumer_offer: float = Field(..., gt=0)
    reason: str = Field(default="Not provided", min_length=3, max_length=500)
    urgency: Literal["Critical", "Essential", "Normal", "Flexible"] = "Normal"


class NegotiationResponse(BaseModel):
    id: int

    listing_id: int

    producer: str
    consumer: str

    energy: float

    producer_price: float
    consumer_offer: float

    negotiated_price: float | None

    status: str
    reason: str | None = None
    urgency: str = "Normal"

    created_at: datetime

    class Config:
        from_attributes = True


class AssistantChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    # Short conversational context improves follow-up questions. Marketplace
    # data itself is always reloaded on the server from the authenticated user.
    history: list[AssistantChatTurn] = Field(default_factory=list, max_length=12)


class AssistantChatResponse(BaseModel):
    answer: str


class ProducerInsightsRequest(BaseModel):
    weather: dict = Field(default_factory=dict)
