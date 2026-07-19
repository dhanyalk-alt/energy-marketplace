import "./SunMoonCard.css";

function SunMoonCard({ weather }) {
  if (!weather) return null;

  const astro = weather.forecast.forecastday[0].astro;

  return (
    <div className="sunmoon-card">

      <h3 className="sunmoon-title">
        🌞 Sun & Moon
      </h3>

      <div className="sunmoon-row">
        <span>🌅 Sunrise</span>
        <strong>{astro.sunrise}</strong>
      </div>

      <div className="sunmoon-row">
        <span>🌇 Sunset</span>
        <strong>{astro.sunset}</strong>
      </div>

      <div className="sunmoon-row">
        <span>🌙 Moonrise</span>
        <strong>{astro.moonrise}</strong>
      </div>

      <div className="sunmoon-row">
        <span>🌑 Moonset</span>
        <strong>{astro.moonset}</strong>
      </div>

      <hr />

      <div className="moon-phase">
        🌒 {astro.moon_phase}
      </div>

    </div>
  );
}

export default SunMoonCard;