import "./AirQualityCard.css";
import { getAQILevel, getAQIColor } from "./constants";

function AirQualityCard({ weather }) {
  if (!weather) return null;

  const epaIndex = weather.current.air_quality["us-epa-index"];

  const pm25 = weather.current.air_quality.pm2_5.toFixed(1);

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
        PM2.5 : {pm25}
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