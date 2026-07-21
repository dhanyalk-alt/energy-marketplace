import "./WeatherAlerts.css";

function WeatherAlert({ weather }) {
  if (!weather) return null;

  const alerts = weather.alerts?.alert || [];

  return (
    <div className="alert-card">

      <h3 className="alert-title">
        ⚠ Weather Alerts
      </h3>

      {alerts.length === 0 ? (
        <div className="no-alert">

          <div className="alert-icon">✅</div>

          <p>No active weather alerts.</p>

        </div>
      ) : (
        alerts.map((alert, index) => (
          <div
            key={index}
            className="alert-item"
          >
            <h4>{alert.headline}</h4>

            <p>{alert.desc}</p>

            <small>
              {alert.effective} — {alert.expires}
            </small>

          </div>
        ))
      )}

    </div>
  );
}

export default WeatherAlert;