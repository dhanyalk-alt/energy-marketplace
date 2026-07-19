import "./ForecastCards.css";

function ForecastCards({
    weather,
    selectedDay,
    setSelectedDay,
}) {
  if (!weather) return null;

  const forecast = weather.forecast.forecastday;

  return (
    <div className="forecast-section">

      <h3 className="forecast-title">7-Day Forecast</h3>

      <div className="forecast-container">
        {forecast.map((day, index) => (
<div
    key={index}
    className={`forecast-item ${
        selectedDay === index ? "selected-card" : ""
    }`}
    onClick={() => setSelectedDay(index)}
>
            <p className="day">
              {index === 0
                ? "Today"
                : new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
            </p>

            <img
              src={`https:${day.day.condition.icon}`}
              alt={day.day.condition.text}
            />

            <p className="temperature">
              <span className="max-temp">
                {Math.round(day.day.maxtemp_c)}°
              </span>

              <span className="slash"> / </span>

              <span className="min-temp">
                {Math.round(day.day.mintemp_c)}°
              </span>
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default ForecastCards;