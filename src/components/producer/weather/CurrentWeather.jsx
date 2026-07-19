import "./CurrentWeather.css";
import WeatherEffects from "./WeatherEffects";

function CurrentWeather({ weather, place }) {
  if (!weather) return null;

  return (
    <div className="current-weather">
      {/* Weather Background Animation */}
      <WeatherEffects weather={weather} />

      {/* Foreground Content */}
      <div className="current-weather-content">
        {/* Location */}
        <div className="location-row">
          <span className="location-dot"></span>

          <h2>
            {place
              ? `${place.village}, ${place.state}`
              : `${weather.location.name}, ${weather.location.region}`}
          </h2>
        </div>

        {/* Main Content */}
        <div className="weather-top">
          <div className="weather-left">
            <img
              src={`https:${weather.current.condition.icon}`}
              alt={weather.current.condition.text}
              className="weather-icon"
            />

            <div className="temp-section">
              <h1>{Math.round(weather.current.temp_c)}</h1>
              <span className="degree">°C</span>
            </div>

            <div className="weather-stats">
              <p>Feels Like: {Math.round(weather.current.feelslike_c)}°C</p>
              <p>Humidity: {weather.current.humidity}%</p>
              <p>Wind: {Math.round(weather.current.wind_kph)} km/h</p>
            </div>
          </div>

          <div className="weather-right">
            <h1>Weather</h1>

            <p>
              {new Date(weather.location.localtime).toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                }
              )}
              ,{" "}
              {new Date(weather.location.localtime).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>

            <p className="condition">
              {weather.current.condition.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CurrentWeather;