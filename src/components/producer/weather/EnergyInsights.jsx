import "./EnergyInsights.css";
import EnergyProgress from "./EnergyProgress";

function EnergyInsights({ weather, showTitle = true }) {
  if (!weather) return null;

  const current = weather.current;

  // ── Time-of-day solar factor ────────────────────────────────────────────────
  // Solar generation follows the sun: zero before sunrise (~6 AM) and after
  // sunset (~19:00 / 7 PM), peaking at solar noon (~13:00 / 1 PM).
  // We use a sine-bell over the [6, 19] hour window so edge hours (dawn/dusk)
  // produce partial potential naturally.
  const now = new Date();
  const localHour = now.getHours() + now.getMinutes() / 60; // fractional hour
  const SUNRISE = 6;   // 6:00 AM
  const SUNSET  = 19;  // 7:00 PM
  const SOLAR_NOON = (SUNRISE + SUNSET) / 2; // ~12:30

  let timeFactor = 0;
  if (localHour > SUNRISE && localHour < SUNSET) {
    // Normalise to [0, π] across the daylight window → sine peak at solar noon
    const progress = (localHour - SUNRISE) / (SUNSET - SUNRISE);
    timeFactor = Math.sin(progress * Math.PI); // 0 → 1 → 0
  }

  // Cloud-clear fraction (0–1): less cloud = more potential
  const clearSkyFraction = Math.max(0, (100 - current.cloud) / 100);

  // Combined solar potential (time × sky clarity), expressed as 0–100%
  const solarPercent = Math.round(timeFactor * clearSkyFraction * 100);

  let solarStatus = "No Sunlight";
  if (solarPercent >= 80) solarStatus = "Excellent";
  else if (solarPercent >= 60) solarStatus = "Good";
  else if (solarPercent >= 40) solarStatus = "Moderate";
  else if (solarPercent >= 10) solarStatus = "Poor";
  // solarPercent < 10 stays "No Sunlight" (night / heavy cloud)

  const wind = current.wind_kph;
  const windPercent = Math.min((wind / 40) * 100, 100);
  let windStatus = "Low";
  if (wind >= 30) windStatus = "Excellent";
  else if (wind >= 20) windStatus = "Good";
  else if (wind >= 10) windStatus = "Moderate";

  const renewableOutput = ((solarPercent * 0.06) + (wind * 0.08)).toFixed(1);

  // At night solarPercent is 0, so wind always wins the comparison.
  // Use timeFactor to explicitly detect night for messaging.
  const isNight = timeFactor === 0;
  const solarIsBest = !isNight && solarPercent > windPercent;
  const bestSource = isNight
    ? "💨 Wind / 🔋 Storage"
    : solarIsBest
    ? "☀ Solar Energy"
    : "💨 Wind Energy";

  let recommendation;
  if (isNight) {
    recommendation =
      wind >= 20
        ? "Nighttime — no solar. Wind generation is active and favorable."
        : "Nighttime — solar unavailable. Rely on wind or stored energy.";
  } else if (solarIsBest) {
    recommendation =
      solarPercent >= 70
        ? "Excellent sunlight. Maximize solar generation today."
        : "Moderate sunlight. Solar production is available.";
  } else {
    recommendation =
      wind >= 20
        ? "Strong winds detected. Wind generation is favorable."
        : "Wind conditions are moderate today.";
  }

  return (
    <div className="energy-section">

      {showTitle && <h2 className="energy-heading">⚡ Energy Insights</h2>}

      <div className="energy-grid">
        <EnergyProgress title="☀ Solar Potential" value={`${solarPercent}%`} percentage={solarPercent} color="#FBBC05" subtitle={solarStatus} />
        <EnergyProgress title="💨 Wind Potential" value={`${wind.toFixed(1)} km/h`} percentage={windPercent} color="#4285F4" subtitle={windStatus} />
        <EnergyProgress title="☁ Cloud Cover" value={`${current.cloud}%`} percentage={current.cloud} color="#9AA0A6" subtitle="Current cloud coverage" />

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
