import "./EnergyInsights.css";
import EnergyProgress from "./EnergyProgress";

function EnergyInsights({ weather }) {
  if (!weather) return null;

  const current = weather.current;

  // Solar Potential
  const solarPercent = Math.max(0, 100 - current.cloud);

  let solarStatus = "Poor";
  if (solarPercent >= 80) solarStatus = "Excellent";
  else if (solarPercent >= 60) solarStatus = "Good";
  else if (solarPercent >= 40) solarStatus = "Moderate";

  // Wind Potential
  const wind = current.wind_kph;
  const windPercent = Math.min((wind / 40) * 100, 100);

  let windStatus = "Low";
  if (wind >= 30) windStatus = "Excellent";
  else if (wind >= 20) windStatus = "Good";
  else if (wind >= 10) windStatus = "Moderate";

  // Renewable Output (demo calculation)
  const renewableOutput = (
    (solarPercent * 0.06) +
    (wind * 0.08)
  ).toFixed(1);

  // Recommendation
  let recommendation = "";
  let bestSource = "";

  if (solarPercent > windPercent) {
    bestSource = "☀ Solar Energy";

    recommendation =
      solarPercent >= 70
        ? "Excellent sunlight. Maximize solar generation today."
        : "Moderate sunlight. Solar production is available.";
  } else {
    bestSource = "💨 Wind Energy";

    recommendation =
      wind >= 20
        ? "Strong winds detected. Wind generation is favorable."
        : "Wind conditions are moderate today.";
  }

  return (
    <div className="energy-section">

      <h2 className="energy-heading">
        ⚡ Energy Insights
      </h2>

      <div className="energy-grid">

        <EnergyProgress
          title="☀ Solar Potential"
          value={`${solarPercent}%`}
          percentage={solarPercent}
          color="#FBBC05"
          subtitle={solarStatus}
        />

        <EnergyProgress
          title="💨 Wind Potential"
          value={`${wind.toFixed(1)} km/h`}
          percentage={windPercent}
          color="#4285F4"
          subtitle={windStatus}
        />

        <EnergyProgress
          title="☁ Cloud Cover"
          value={`${current.cloud}%`}
          percentage={current.cloud}
          color="#9AA0A6"
          subtitle="Current cloud coverage"
        />

        <div className="energy-card">
          <h3>⚡ Estimated Output</h3>

          <h1>{renewableOutput} kWh</h1>

          <p>Estimated renewable generation</p>
        </div>

        <div className="energy-card recommendation-card">
          <h3>🔋 Recommendation</h3>

          <p>{recommendation}</p>
        </div>

        <div className="energy-card best-source-card">
          <h3>🏆 Best Energy Source Today</h3>

          <h2>{bestSource}</h2>
        </div>

      </div>

    </div>
  );
}

export default EnergyInsights;