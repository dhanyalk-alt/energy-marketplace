import "./EnergyProgress.css";

function EnergyProgress({
  title,
  value,
  percentage,
  color,
  subtitle,
}) {
  return (
    <div className="energy-progress-card">

      <h3>{title}</h3>

      <div className="progress-track">

        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
            background: color,
          }}
        />

      </div>

      <h2>{value}</h2>

      <p>{subtitle}</p>

    </div>
  );
}

export default EnergyProgress;