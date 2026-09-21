from collections import defaultdict
from statistics import mean

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.battery_service import get_available_battery_energy
from app.models import BuyRequest, Review, Trading, Transaction, User


URGENCY_WEIGHTS = {
    "Critical": 40,
    "Essential": 30,
    "Normal": 20,
    "Flexible": 10,
}


def _number(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _weather_generation(weather: dict) -> dict:
    current = weather.get("current", {}) if isinstance(weather, dict) else {}
    forecast = weather.get("forecast", {}) if isinstance(weather, dict) else {}
    days = forecast.get("forecastday", []) if isinstance(forecast, dict) else []

    current_cloud = _number(current.get("cloud"), 50)
    future_cloud = [
        _number(day.get("day", {}).get("avgcloud"), current_cloud)
        for day in days[:3]
        if isinstance(day, dict)
    ]
    cloud_reference = mean(future_cloud) if future_cloud else current_cloud
    solar_potential = max(0.0, min(100.0, 100.0 - cloud_reference))

    if not weather:
        return {
            "available": False,
            "solar_potential": None,
            "trend": "limited",
            "explanation": "Weather forecast data is unavailable, so generation outlook is limited.",
        }

    if cloud_reference <= current_cloud - 10:
        trend = "increase"
        explanation = "Forecast cloud cover is lower than current conditions, which should improve solar generation."
    elif cloud_reference >= current_cloud + 10:
        trend = "decrease"
        explanation = "Forecast cloud cover is higher than current conditions, which may reduce solar generation."
    else:
        trend = "stable"
        explanation = "Forecast cloud cover is similar to current conditions, so solar generation is likely to remain broadly stable."

    return {
        "available": True,
        "solar_potential": round(solar_potential, 1),
        "trend": trend,
        "explanation": explanation,
    }


async def _consumer_reliability(db: AsyncSession, consumer: str) -> dict:
    consumer_id = await db.scalar(select(User.id).where(User.username == consumer))
    transactions = (await db.execute(
        select(Transaction).where(Transaction.consumer_id == consumer_id)
    )).scalars().all()
    requests = (await db.execute(
        select(BuyRequest).where(BuyRequest.consumer == consumer)
    )).scalars().all()
    reviews = (await db.execute(
        select(Review).where(Review.consumer == consumer)
    )).scalars().all()

    completed = len(transactions)
    rejected = len([item for item in requests if item.status == "Rejected"])
    processed = len([item for item in requests if item.status in {"Accepted", "Rejected"}])
    completion_rate = completed / processed if processed else None

    # This project does not record consumer ratings. Review activity is only a
    # small evidence signal; it never overrides urgency or energy availability.
    score = 50.0
    if completion_rate is not None:
        score += (completion_rate - 0.5) * 50
    score += min(completed, 10) * 2
    score -= min(rejected, 5) * 3
    score = max(0.0, min(100.0, score))

    evidence = []
    if completed:
        evidence.append(f"{completed} completed trade{'s' if completed != 1 else ''}")
    if rejected:
        evidence.append(f"{rejected} rejected request{'s' if rejected != 1 else ''}")
    if reviews:
        evidence.append(f"{len(reviews)} review{'s' if len(reviews) != 1 else ''} submitted")
    if not evidence:
        evidence.append("limited transaction history")

    return {
        "score": round(score, 1),
        "completed_trades": completed,
        "rejected_requests": rejected,
        "review_count": len(reviews),
        "explanation": "Reliability is based on " + ", ".join(evidence) + ".",
    }


def _priority(request: BuyRequest, reliability: dict, available_energy: float) -> dict:
    urgency = request.urgency if request.urgency in URGENCY_WEIGHTS else "Normal"
    reason = (request.reason or "No reason provided").strip()
    energy = _number(request.energy)
    offer = _number(request.offered_price, _number(request.total_price) / energy if energy else 0)
    availability_ratio = energy / available_energy if available_energy > 0 else 1
    reason_text = reason.lower()
    critical_reason = any(word in reason_text for word in ["medical", "hospital", "emergency", "outage", "safety"])

    score = URGENCY_WEIGHTS[urgency]
    score += 12 if critical_reason else 0
    score += min(20, reliability["score"] * 0.2)
    score += min(12, offer * 0.4)
    score -= 18 if availability_ratio > 0.8 else 8 if availability_ratio > 0.5 else 0
    score = round(max(0, min(100, score)), 1)
    priority_level = "High" if score >= 70 else "Medium" if score >= 45 else "Low"

    return {
        "request_id": request.id,
        "consumer": request.consumer,
        "score": score,
        "priority_level": priority_level,
        "urgency": urgency,
        "reason": reason,
        "energy": energy,
        "offered_price": round(offer, 2),
        "reliability": reliability,
        "explanation": (
            f"{urgency} urgency, {energy:.2f} kWh requested at ₹{offer:.2f}/kWh, "
            f"consumer reliability {reliability['score']:.0f}/100"
            + (", and the stated reason includes a critical-need signal." if critical_reason else ".")
        ),
    }


async def get_producer_insights(
    db: AsyncSession,
    producer: str,
    weather: dict | None = None,
) -> dict:
    listings = (await db.execute(select(Trading).where(
        Trading.producer == producer,
        Trading.status == "Available",
    ))).scalars().all()
    requests = (await db.execute(select(BuyRequest).where(
        BuyRequest.producer == producer,
        BuyRequest.status == "Pending",
    ))).scalars().all()
    producer_id = await db.scalar(select(User.id).where(User.username == producer))
    transactions = (await db.execute(select(Transaction).where(
        Transaction.producer_id == producer_id,
    ).order_by(Transaction.created_at.desc()).limit(20))).scalars().all()

    battery = get_available_battery_energy()
    available_energy = _number(battery.get("available_energy_kwh"))
    capacity = _number(battery.get("capacity_kwh"))
    supply = sum(_number(item.energy) for item in listings)
    demand = sum(_number(item.energy) for item in requests)
    current_prices = [_number(item.price) for item in listings if _number(item.price) > 0]
    recent_prices = [_number(item.price_per_kwh) for item in transactions if _number(item.price_per_kwh) > 0]
    current_price = mean(current_prices) if current_prices else (mean(recent_prices) if recent_prices else 0.0)
    recent_price = mean(recent_prices) if recent_prices else None
    weather_outlook = _weather_generation(weather or {})

    demand_pressure = demand / supply if supply > 0 else 0
    surplus = max(0.0, min(available_energy, supply) - demand)
    weather_adjustment = 0.05 if weather_outlook["trend"] == "decrease" else -0.04 if weather_outlook["trend"] == "increase" else 0
    demand_adjustment = min(0.15, max(-0.10, (demand_pressure - 0.6) * 0.15))
    trade_adjustment = 0 if recent_price is None or current_price <= 0 else max(-0.08, min(0.08, (recent_price - current_price) / current_price * 0.35))
    suggested_price = current_price * (1 + demand_adjustment + weather_adjustment + trade_adjustment) if current_price else 0

    predicted_price = current_price * (1 + demand_adjustment + weather_adjustment) if current_price else 0
    change = predicted_price - current_price
    direction = "increase" if change > 0.15 else "decrease" if change < -0.15 else "stable"
    prediction_limited = recent_price is None or not weather_outlook["available"]

    reliability_cache = {}
    priorities = []
    for request in requests:
        if request.consumer not in reliability_cache:
            reliability_cache[request.consumer] = await _consumer_reliability(db, request.consumer)
        priorities.append(_priority(request, reliability_cache[request.consumer], available_energy))
    priorities.sort(key=lambda item: item["score"], reverse=True)
    recommended_request = priorities[0] if priorities else None

    if available_energy <= capacity * 0.2:
        battery_decision = "STORE"
        battery_reason = "Battery reserve is low, so retaining energy protects essential supply."
    elif weather_outlook["trend"] == "increase" and surplus > 0:
        battery_decision = "SELL PARTIAL SURPLUS"
        battery_reason = "Expected generation is improving; sell only the available surplus while retaining a reserve."
    elif weather_outlook["trend"] == "decrease" and demand_pressure >= 0.7:
        battery_decision = "HOLD"
        battery_reason = "Demand is high and forecast generation may decline, so preserve energy until conditions are clearer."
    elif surplus > 0 and demand_pressure < 0.8:
        battery_decision = "SELL"
        battery_reason = "There is usable surplus after pending demand and the battery reserve is adequate."
    else:
        battery_decision = "HOLD"
        battery_reason = "Available energy and pending demand call for a cautious reserve."

    if battery_decision == "STORE":
        final_action = "STORE"
    elif weather_outlook["trend"] == "decrease" and direction == "increase":
        final_action = "WAIT"
    elif battery_decision == "SELL PARTIAL SURPLUS":
        final_action = "SELL PARTIAL SURPLUS"
    elif battery_decision == "SELL":
        final_action = "SELL"
    else:
        final_action = "HOLD"

    return {
        "request_priority": {
            "recommended_request": recommended_request,
            "requests": priorities,
            "available_energy": round(available_energy, 2),
        },
        "selling_price": {
            "suggested_price": round(suggested_price, 2),
            "current_market_price": round(current_price, 2),
            "explanation": "Recommendation uses active supply, pending demand, recent completed trade prices, and the generation outlook. It never changes your listing price automatically.",
        },
        "weather_trading": {
            **weather_outlook,
            "action": "SELL PARTIAL SURPLUS" if weather_outlook["trend"] == "increase" and surplus > 0 else "HOLD" if weather_outlook["trend"] == "decrease" else "SELL",
        },
        "battery_decision": {
            "action": battery_decision,
            "available_energy": round(available_energy, 2),
            "capacity": round(capacity, 2),
            "surplus": round(surplus, 2),
            "explanation": battery_reason,
        },
        "market_prediction": {
            "current_price": round(current_price, 2),
            "predicted_price": round(predicted_price, 2),
            "direction": direction,
            "limited": prediction_limited,
            "explanation": "Prediction is estimated from current listings, recent completed trades when available, pending demand, and forecast conditions." if not prediction_limited else "Limited estimate: historical trade or weather information is incomplete, so this uses the available current data only.",
        },
        "what_to_do_now": {
            "action": final_action,
            "explanation": f"{battery_reason} Market price is predicted to remain {direction}, and {('a high-priority request is available.' if recommended_request else 'there are no pending requests to prioritize.')}",
        },
    }
