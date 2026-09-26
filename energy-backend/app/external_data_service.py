"""Server-side integrations for location-based energy assistant tools."""

import os
import time
from typing import Any

import httpx


WEATHER_URL = "https://api.weatherapi.com/v1/forecast.json"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
NEWS_URL = "https://newsapi.org/v2/everything"

# Public Overpass instances are a shared community resource. Cache nearby
# searches briefly so repeated assistant questions do not generate duplicate
# map queries.
_nearby_business_cache: dict[tuple[float, float], tuple[float, list[dict[str, Any]]]] = {}
OVERPASS_CACHE_SECONDS = 300


class ExternalDataError(RuntimeError):
    """Safe error returned when an optional external integration is unavailable."""


def _api_key(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value or value.startswith("replace_with_"):
        raise ExternalDataError(f"{name} is not configured on the server.")
    return value


def _coordinates(latitude: float, longitude: float) -> tuple[float, float]:
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ExternalDataError("The shared location is invalid.")
    return latitude, longitude


async def get_weather(latitude: float, longitude: float, days: int = 2) -> dict[str, Any]:
    latitude, longitude = _coordinates(latitude, longitude)
    key = os.getenv("WEATHER_API_KEY", "").strip()
    if not key or key.startswith("replace_with_"):
        return await _get_open_meteo_weather(latitude, longitude, days)

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(
                WEATHER_URL,
                params={
                    "key": key,
                    "q": f"{latitude},{longitude}",
                    "days": max(1, min(days, 7)),
                    "aqi": "yes",
                    "alerts": "yes",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError:
        raise ExternalDataError("Weather information is unavailable right now.")
    except httpx.HTTPError:
        raise ExternalDataError("The server could not reach the weather service.")


def _weather_condition(code: int, is_day: bool = True) -> dict[str, str]:
    """Map WMO codes to display labels/icons; all weather values remain live."""
    code = int(code or 0)
    if code == 0:
        text, icon = "Clear sky", "113"
    elif code in {1, 2}:
        text, icon = "Partly cloudy", "116"
    elif code == 3:
        text, icon = "Overcast", "122"
    elif code in {45, 48}:
        text, icon = "Fog", "248"
    elif code in {51, 53, 55, 56, 57}:
        text, icon = "Drizzle", "296"
    elif code in {61, 63, 65, 66, 67}:
        text, icon = "Rain", "308"
    elif code in {71, 73, 75, 77, 85, 86}:
        text, icon = "Snow", "338"
    elif code in {80, 81, 82}:
        text, icon = "Rain showers", "353"
    else:
        text, icon = "Thunderstorm", "386"
    period = "day" if is_day else "night"
    return {"text": text, "icon": f"//cdn.weatherapi.com/weather/64x64/{period}/{icon}.png"}


def _epa_index(us_aqi: float | None) -> int | None:
    if us_aqi is None:
        return None
    if us_aqi <= 50:
        return 1
    if us_aqi <= 100:
        return 2
    if us_aqi <= 150:
        return 3
    if us_aqi <= 200:
        return 4
    if us_aqi <= 300:
        return 5
    return 6


async def _get_open_meteo_weather(latitude: float, longitude: float, days: int) -> dict[str, Any]:
    """Return live Open-Meteo data in the shape consumed by the existing forecast UI.

    This keeps Forecasting operational when a WeatherAPI key has not yet been
    configured, while all external calls remain server-side.
    """
    safe_days = max(1, min(days, 7))
    forecast_params = {
        "latitude": latitude,
        "longitude": longitude,
        "forecast_days": safe_days,
        "timezone": "auto",
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,cloud_cover,weather_code,wind_speed_10m,visibility,uv_index",
        "hourly": "temperature_2m,precipitation_probability,wind_speed_10m,weather_code",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,moonrise,moonset,moon_phase",
    }
    air_params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "pm2_5,us_aqi",
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            forecast_response = await client.get(OPEN_METEO_URL, params=forecast_params)
            forecast_response.raise_for_status()
            air_response = await client.get(OPEN_METEO_AIR_URL, params=air_params)
            air_response.raise_for_status()
    except httpx.HTTPError:
        raise ExternalDataError("Weather information is unavailable right now.")

    source = forecast_response.json()
    air = air_response.json().get("current", {})
    current = source.get("current", {})
    hourly = source.get("hourly", {})
    daily = source.get("daily", {})
    dates = daily.get("time", [])
    hour_rows = list(zip(
        hourly.get("time", []),
        hourly.get("temperature_2m", []),
        hourly.get("precipitation_probability", []),
        hourly.get("wind_speed_10m", []),
        hourly.get("weather_code", []),
    ))

    def clock(value: str | None) -> str:
        return str(value or "Unavailable").split("T")[-1]

    forecast_days = []
    for index, date in enumerate(dates):
        day_code = daily.get("weather_code", [0])[index]
        forecast_days.append({
            "date": date,
            "day": {
                "maxtemp_c": daily.get("temperature_2m_max", [None])[index],
                "mintemp_c": daily.get("temperature_2m_min", [None])[index],
                "condition": _weather_condition(day_code),
            },
            "astro": {
                "sunrise": clock(daily.get("sunrise", [None])[index]),
                "sunset": clock(daily.get("sunset", [None])[index]),
                "moonrise": clock(daily.get("moonrise", [None])[index]),
                "moonset": clock(daily.get("moonset", [None])[index]),
                "moon_phase": str(daily.get("moon_phase", ["Unavailable"])[index]),
            },
            "hour": [
                {
                    "time": timestamp,
                    "temp_c": temperature,
                    "chance_of_rain": chance_rain,
                    "wind_kph": wind,
                    "condition": _weather_condition(code),
                }
                for timestamp, temperature, chance_rain, wind, code in hour_rows
                if str(timestamp).startswith(str(date))
            ],
        })

    condition = _weather_condition(current.get("weather_code", 0), bool(current.get("is_day", 1)))
    return {
        "location": {
            "name": "Shared location",
            "region": "Live forecast",
            "localtime": current.get("time"),
        },
        "current": {
            "temp_c": current.get("temperature_2m"),
            "feelslike_c": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "wind_kph": current.get("wind_speed_10m"),
            "vis_km": round((current.get("visibility") or 0) / 1000, 1),
            "uv": current.get("uv_index"),
            "cloud": current.get("cloud_cover"),
            "is_day": current.get("is_day"),
            "condition": condition,
            "air_quality": {
                "us-epa-index": _epa_index(air.get("us_aqi")),
                "pm2_5": air.get("pm2_5"),
            },
        },
        "forecast": {"forecastday": forecast_days},
        "alerts": {"alert": []},
        "source": "Open-Meteo fallback",
    }


async def get_nearby_solar_businesses(latitude: float, longitude: float) -> list[dict[str, Any]]:
    latitude, longitude = _coordinates(latitude, longitude)
    cache_key = (round(latitude, 3), round(longitude, 3))
    cached = _nearby_business_cache.get(cache_key)
    if cached and time.monotonic() - cached[0] < OVERPASS_CACHE_SECONDS:
        return cached[1]

    # Search named solar, photovoltaic, inverter, and battery businesses in a
    # bounded radius. The coordinates come solely from browser permission.
    query = f"""
        [out:json][timeout:20];
        (
          nwr(around:8000,{latitude},{longitude})[\"name\"~\"solar|photovoltaic|inverter|battery\",i];
          nwr(around:8000,{latitude},{longitude})[\"shop\"~\"solar|electrical\",i];
        );
        out center tags 30;
    """
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                OVERPASS_URL,
                data={"data": query},
                headers={"User-Agent": "EnergyMarketplace/1.0 (nearby-solar-search)"},
            )
            response.raise_for_status()
            elements = response.json().get("elements", [])
    except httpx.HTTPStatusError:
        raise ExternalDataError("Nearby business search is unavailable right now.")
    except httpx.HTTPError:
        raise ExternalDataError("The server could not reach the OpenStreetMap search service.")

    businesses = []
    seen = set()
    for element in elements:
        tags = element.get("tags", {})
        name = tags.get("name")
        center = element.get("center", {})
        business_lat = element.get("lat", center.get("lat"))
        business_lon = element.get("lon", center.get("lon"))
        if not name or business_lat is None or business_lon is None:
            continue
        address_parts = [
            tags.get("addr:housenumber"), tags.get("addr:street"),
            tags.get("addr:city"), tags.get("addr:postcode"),
        ]
        address = ", ".join(str(part) for part in address_parts if part) or tags.get("addr:full")
        dedupe_key = (name.casefold(), address or "", business_lat, business_lon)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        businesses.append({
            "name": name,
            "address": address,
            "rating": tags.get("stars"),
            "map_url": f"https://www.openstreetmap.org/?mlat={business_lat}&mlon={business_lon}#map=18/{business_lat}/{business_lon}",
        })
        if len(businesses) == 10:
            break

    _nearby_business_cache[cache_key] = (time.monotonic(), businesses)
    return businesses


async def search_energy_news(query: str) -> list[dict[str, Any]]:
    key = _api_key("SEARCH_API_KEY")
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(
                NEWS_URL,
                params={
                    "q": query,
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 5,
                    "apiKey": key,
                },
            )
            response.raise_for_status()
            articles = response.json().get("articles", [])
    except httpx.HTTPStatusError:
        raise ExternalDataError("Current news search is unavailable right now.")
    except httpx.HTTPError:
        raise ExternalDataError("The server could not reach the news service.")

    return [
        {
            "title": article.get("title"),
            "source": article.get("source", {}).get("name"),
            "published_at": article.get("publishedAt"),
            "summary": article.get("description"),
            "url": article.get("url"),
        }
        for article in articles
        if article.get("title") and article.get("url")
    ]
