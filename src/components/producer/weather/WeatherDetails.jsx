import "./WeatherDetails.css";

import AirQualityCard from "./AirQualityCard";
import SunMoonCard from "./SunMoonCard";
import WeatherAlert from "./WeatherAlerts";

function WeatherDetails({ weather }) {
  if (!weather) return null;

  const current = weather.current;

  return (
    <div className="weather-details-section">
      <h2 className="section-title">Today's Highlights</h2>

      <div className="weather-details-grid">

        {/* Feels Like */}
        <div className="weather-card">
          <h3>🌡 Feels Like</h3>
          <p>{Math.round(current.feelslike_c)}°C</p>
        </div>

        {/* Humidity */}
        <div className="weather-card">
          <h3>💧 Humidity</h3>
          <p>{current.humidity}%</p>
        </div>

        {/* Wind */}
        <div className="weather-card">
          <h3>🌬 Wind</h3>
          <p>{Math.round(current.wind_kph)} km/h</p>
        </div>

        {/* Visibility */}
        <div className="weather-card">
          <h3>👁 Visibility</h3>
          <p>{current.vis_km} km</p>
        </div>

        {/* UV Index */}
        <div className="weather-card">
          <h3>☀ UV Index</h3>
          <p>{current.uv}</p>
        </div>

        {/* Air Quality */}
        <AirQualityCard weather={weather} />

        {/* Sun & Moon */}
        <SunMoonCard weather={weather} />

        {/* Weather Alerts */}
        <WeatherAlert weather={weather} />

      </div>
    </div>
  );
}

export default WeatherDetails;