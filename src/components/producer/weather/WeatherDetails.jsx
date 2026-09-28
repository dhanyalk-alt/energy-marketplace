import "./WeatherDetails.css";

import AirQualityCard from "./AirQualityCard";
import SunMoonCard from "./SunMoonCard";
import WeatherAlert from "./WeatherAlerts";

function WeatherDetails({ weather, showTitle = true }) {
  if (!weather) return null;

  return (
    <div className="weather-details-section">
      {showTitle && <h2 className="section-title">Today's Highlights</h2>}

      <div className="weather-details-grid">

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
