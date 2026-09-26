import "./AirQualityCard.css";
import { getAQILevel, getAQIColor } from "./constants";

function AirQualityCard({ weather }) {
  if (!weather) return null;

  const airQuality = weather?.current?.air_quality;
  const epaIndex = Number(airQuality?.["us-epa-index"]);
  const pm25 = Number(airQuality?.pm2_5);

  if (!Number.isFinite(epaIndex) || !Number.isFinite(pm25)) {
    return (
      <div className="aq-card">
        <div className="aq-header">🌫 Air Quality</div>
        <div className="aq-status">Unavailable</div>
        <div className="aq-value">The weather provider did not return air-quality data.</div>
      </div>
    );
  }

  return (
    <div className="aq-card">

      <div className="aq-header">
        🌫 Air Quality
      </div>

      <div
        className="aq-status"
        style={{
          color: getAQIColor(epaIndex),
        }}
      >
        {getAQILevel(epaIndex)}
      </div>

      <div className="aq-value">
        PM2.5 : {pm25.toFixed(1)}
      </div>

      <div className="aq-bar">

        <div
          className="aq-progress"
          style={{
            width: `${(epaIndex / 6) * 100}%`,
            background: getAQIColor(epaIndex),
          }}
        ></div>

      </div>

    </div>
  );
}

export default AirQualityCard;
