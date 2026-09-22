"""Build a small, permission-safe live context for the natural-language assistant."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.battery_service import get_available_battery_energy
from app.models import BuyRequest, Negotiation, Trading, Transaction


def _listing(item: Trading) -> dict:
    return {
        "id": item.id,
        "producer": item.producer,
        "energy_kwh": item.energy,
        "price_per_kwh": item.price,
        "status": item.status,
    }


def _request(item: BuyRequest) -> dict:
    return {
        "id": item.id,
        "consumer": item.consumer,
        "producer": item.producer,
        "energy_kwh": item.energy,
        "total_price": item.total_price,
        "offered_price_per_kwh": item.offered_price,
        "reason": item.reason,
        "urgency": item.urgency,
        "status": item.status,
    }


def _negotiation(item: Negotiation) -> dict:
    return {
        "id": item.id,
        "producer": item.producer,
        "consumer": item.consumer,
        "energy_kwh": item.energy,
        "producer_price": item.producer_price,
        "consumer_offer": item.consumer_offer,
        "negotiated_price": item.negotiated_price,
        "reason": item.reason,
        "urgency": item.urgency,
        "status": item.status,
    }


async def build_assistant_context(db: AsyncSession, user: dict) -> dict:
    """Return only marketplace records the signed-in role is allowed to see."""
    username = user["sub"]
    role = user.get("role", "consumer")
    context = {"signed_in_user": username, "role": role}

    if role == "producer":
        listings = (await db.execute(
            select(Trading).where(Trading.producer == username).order_by(Trading.id.desc()).limit(20)
        )).scalars().all()
        requests = (await db.execute(
            select(BuyRequest).where(BuyRequest.producer == username).order_by(BuyRequest.id.desc()).limit(30)
        )).scalars().all()
        negotiations = (await db.execute(
            select(Negotiation).where(Negotiation.producer == username).order_by(Negotiation.id.desc()).limit(20)
        )).scalars().all()
        context.update({
            "my_listings": [_listing(item) for item in listings],
            "incoming_buy_requests": [_request(item) for item in requests],
            "my_negotiations": [_negotiation(item) for item in negotiations],
            "battery": get_available_battery_energy(),
        })
    else:
        listings = (await db.execute(
            select(Trading).where(Trading.status == "Available").order_by(Trading.id.desc()).limit(30)
        )).scalars().all()
        requests = (await db.execute(
            select(BuyRequest).where(BuyRequest.consumer == username).order_by(BuyRequest.id.desc()).limit(20)
        )).scalars().all()
        negotiations = (await db.execute(
            select(Negotiation).where(Negotiation.consumer == username).order_by(Negotiation.id.desc()).limit(20)
        )).scalars().all()
        context.update({
            "available_listings": [_listing(item) for item in listings],
            "my_buy_requests": [_request(item) for item in requests],
            "my_negotiations": [_negotiation(item) for item in negotiations],
        })

    transactions = (await db.execute(
        select(Transaction).where(
            Transaction.producer == username if role == "producer" else Transaction.consumer == username
        ).order_by(Transaction.created_at.desc()).limit(20)
    )).scalars().all()
    context["my_recent_transactions"] = [{
        "id": item.id,
        "energy_kwh": item.energy,
        "price_per_kwh": item.price,
        "total_amount": item.total_amount,
        "status": item.status,
    } for item in transactions]

    return context
