"""Permission-safe tool implementations for Gemini function calling."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.battery_service import get_available_battery_energy
from app.external_data_service import (
    ExternalDataError,
    get_nearby_solar_businesses,
    get_weather,
    search_energy_news,
)
from app.models import BuyRequest, Trading


TOOL_DECLARATIONS = [
    {
        "name": "get_market_info",
        "description": "Get current marketplace supply, lowest and highest listing prices, average price, and currently available listings from PostgreSQL.",
        "parametersJsonSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_my_requests",
        "description": "Get the authenticated user's own pending and recent buy or sell requests from PostgreSQL. Never use this to fetch another user's private requests.",
        "parametersJsonSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_battery_info",
        "description": "Get the authenticated producer's current battery status. This is unavailable to consumer accounts.",
        "parametersJsonSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_weather",
        "description": "Get current weather and a short forecast for the user's browser-shared location. Use for weather, rain, temperature, forecast, or solar-generation-weather questions.",
        "parametersJsonSchema": {"type": "object", "properties": {"days": {"type": "integer", "minimum": 1, "maximum": 7}}},
    },
    {
        "name": "get_nearby_solar_businesses",
        "description": "Find nearby solar shops, installers, panel dealers, inverter dealers, and battery suppliers from OpenStreetMap around the user's browser-shared location.",
        "parametersJsonSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "search_energy_news",
        "description": "Search current solar, renewable-energy, energy-storage, or grid news. Use only for time-sensitive current developments or news questions.",
        "parametersJsonSchema": {
            "type": "object",
            "properties": {"query": {"type": "string", "minLength": 3, "maxLength": 160}},
            "required": ["query"],
        },
    },
]


class AssistantToolExecutor:
    def __init__(self, db: AsyncSession, user: dict, location: dict[str, float] | None):
        self.db = db
        self.username = user["sub"]
        self.role = user.get("role", "consumer")
        self.location = location

    async def execute(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        handlers = {
            "get_market_info": self._market_info,
            "get_my_requests": self._my_requests,
            "get_battery_info": self._battery_info,
            "get_weather": self._weather,
            "get_nearby_solar_businesses": self._nearby_businesses,
            "search_energy_news": self._news,
        }
        handler = handlers.get(name)
        if handler is None:
            return {"available": False, "message": "This requested tool is not available."}
        try:
            return await handler(arguments)
        except ExternalDataError as error:
            return {"available": False, "message": str(error)}

    async def _market_info(self, _arguments: dict[str, Any]) -> dict[str, Any]:
        listings = (await self.db.execute(
            select(Trading)
            .where(Trading.status == "Available", Trading.energy > 0)
            .order_by(Trading.price.asc())
            .limit(50)
        )).scalars().all()
        pending_requests = (await self.db.execute(
            select(BuyRequest).where(BuyRequest.status == "Pending")
        )).scalars().all()
        if not listings:
            return {
                "available": False,
                "message": "There are no active marketplace listings.",
                "pending_demand_kwh": round(sum(float(item.energy) for item in pending_requests), 2),
                "pending_request_count": len(pending_requests),
            }
        prices = [float(item.price) for item in listings]
        return {
            "available": True,
            "listing_count": len(listings),
            "available_energy_kwh": round(sum(float(item.energy) for item in listings), 2),
            "pending_demand_kwh": round(sum(float(item.energy) for item in pending_requests), 2),
            "pending_request_count": len(pending_requests),
            "lowest_price_per_kwh": min(prices),
            "highest_price_per_kwh": max(prices),
            "average_price_per_kwh": round(sum(prices) / len(prices), 2),
            "lowest_price_sellers": [
                {"producer": item.producer, "price_per_kwh": item.price, "energy_kwh": item.energy}
                for item in listings[:5]
            ],
        }

    async def _my_requests(self, _arguments: dict[str, Any]) -> dict[str, Any]:
        owner_field = BuyRequest.producer if self.role == "producer" else BuyRequest.consumer
        requests = (await self.db.execute(
            select(BuyRequest)
            .where(owner_field == self.username)
            .order_by(BuyRequest.created_at.desc())
            .limit(30)
        )).scalars().all()
        return {
            "available": True,
            "role": self.role,
            "pending_count": sum(item.status == "Pending" for item in requests),
            "requests": [
                {
                    "id": item.id,
                    "counterparty": item.consumer if self.role == "producer" else item.producer,
                    "energy_kwh": item.energy,
                    "total_price": item.total_price,
                    "status": item.status,
                    "reason": item.reason,
                    "urgency": item.urgency,
                }
                for item in requests
            ],
        }

    async def _battery_info(self, _arguments: dict[str, Any]) -> dict[str, Any]:
        if self.role != "producer":
            return {"available": False, "message": "Battery details are available only to the signed-in producer."}
        return {"available": True, "battery": get_available_battery_energy()}

    def _location_or_message(self) -> tuple[float, float] | None:
        if not self.location:
            return None
        return self.location["latitude"], self.location["longitude"]

    async def _weather(self, arguments: dict[str, Any]) -> dict[str, Any]:
        location = self._location_or_message()
        if location is None:
            return {"available": False, "requires_location": True, "message": "Location permission is required. Ask the user to select Share location in the assistant."}
        weather = await get_weather(location[0], location[1], int(arguments.get("days", 2)))
        return {"available": True, "weather": weather}

    async def _nearby_businesses(self, _arguments: dict[str, Any]) -> dict[str, Any]:
        location = self._location_or_message()
        if location is None:
            return {"available": False, "requires_location": True, "message": "Location permission is required. Ask the user to select Share location in the assistant."}
        return {"available": True, "businesses": await get_nearby_solar_businesses(*location)}

    async def _news(self, arguments: dict[str, Any]) -> dict[str, Any]:
        query = str(arguments.get("query", "renewable energy")).strip()[:160]
        return {"available": True, "articles": await search_energy_news(query)}
