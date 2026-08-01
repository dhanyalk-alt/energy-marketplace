
# Energy Marketplace

Energy Marketplace is a full-stack web application that allows renewable energy producers and consumers to trade surplus energy efficiently.

## Features
- User Authentication (Register/Login)
- JWT-based Secure Authentication
- Role-based Access (Producer & Consumer)
- Producer Dashboard
- Consumer Dashboard
- Energy Trading System
- PostgreSQL Database Integration
- Responsive React Frontend
- FastAPI Backend APIs

## Tech Stack
### Frontend
- React.js
- JavaScript
- CSS

### Backend
- FastAPI
- Python
- SQLAlchemy
- JWT Authentication

### Database
- PostgreSQL

## Future Enhancements
- Real-time energy trading
- Payment integration
- AI-based energy forecasting
- Analytics dashboard
- Notifications and alerts

Weather Dashboard Component

A React-based weather dashboard that shows current conditions, a 7-day forecast, air quality, sun/moon times, weather alerts, an interactive map, and simple solar/wind "energy insight" estimates — all built around the user's live geolocation.

Folder structure

weather/
├── Forecasting.jsx / .css        # Top-level container that composes everything below
├── useWeather.js                 # Core hook: geolocation → weather + place data
├── weatherService.js             # WeatherAPI.com fetch (current + 7-day forecast + AQI + alerts)
├── locationService.js            # Reverse geocoding via OpenStreetMap Nominatim
├── constants.js                  # AQI index → label/color helpers
│
├── CurrentWeather.jsx / .css     # Big "now" card (temp, condition, location)
├── WeatherEffects.jsx / .css     # Animated background (sunny/rain/storm/etc.)
├── WeatherTabs.jsx / .css        # Tab selector: temperature / precipitation / wind
├── WeatherChart.jsx / .css       # Recharts area chart driven by the selected tab
├── ForecastCards.jsx / .css      # 7-day forecast row, click to select a day
├── WeatherDetails.jsx / .css     # "Today's Highlights" section, wraps the 3 cards below
├── AirQualityCard.jsx / .css     # AQI reading + label/color
├── SunMoonCard.jsx / .css        # Sunrise/sunset, moonrise/moonset
├── WeatherAlerts.jsx / .css      # Official weather alerts, if any
├── WeatherMap.jsx / .css         # Leaflet map centered on the user's location
├── EnergyInsights.jsx / .css     # Solar/wind potential estimated from cloud cover & wind speed
└── EnergyProgress.jsx / .css     # Reusable progress-bar card used by EnergyInsights

How data flows


useWeather() asks the browser for geolocation.
On success, it calls weatherService.getWeatherData(lat, lon) (WeatherAPI.com — 7-day forecast, AQI, alerts) and locationService.getLocationName(lat, lon) (Nominatim reverse geocoding) in parallel-ish sequence.
It exposes { weather, place, loading, error, refreshWeather, latitude, longitude }.
Forecasting.jsx consumes the hook and passes weather/place down to all the presentational components, which are pure if (!weather) return null renderers.


Dependencies

Based on the imports, you'll need:


react (hooks: useState, useEffect)
axios — HTTP calls
recharts — WeatherChart
react-leaflet, leaflet, leaflet-defaulticon-compatibility — WeatherMap