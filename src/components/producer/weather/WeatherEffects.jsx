import "./WeatherEffects.css";

function WeatherEffects({ weather }) {
  if (!weather) return null;

  const condition = weather.current.condition.text.toLowerCase();
  const isDay = weather.current.is_day === 1;

  const isMist =
    condition.includes("mist") ||
    condition.includes("fog") ||
    condition.includes("haze");

  const isRain =
    condition.includes("rain") ||
    condition.includes("drizzle") ||
    condition.includes("shower");

  const isStorm =
    condition.includes("thunder") ||
    condition.includes("storm");

  const isSnow =
    condition.includes("snow");

  const isCloud =
    condition.includes("cloud") ||
    condition.includes("overcast");

  let bgClass = "sunny-bg";

  if (isStorm) {
    bgClass = "storm-bg";
  } else if (isRain) {
    bgClass = "rain-bg";
  } else if (isSnow) {
    bgClass = "snow-bg";
  } else if (isMist) {
    bgClass = "mist-bg";
  } else if (isCloud) {
    bgClass = "cloudy-bg";
  } else if (!isDay) {
    bgClass = "night-bg";
  }

  return (
    <div className={`weather-effects ${bgClass}`}>

      {/* SUN */}
      {isDay &&
        !isRain &&
        !isStorm &&
        !isSnow &&
        !isMist && (
          <div className="sun"></div>
      )}

      {/* CLOUDS */}
      {(isCloud || isRain || isStorm || isMist) && (
        <>
          <div className="cloud cloud1"></div>
          <div className="cloud cloud2"></div>
          <div className="cloud cloud3"></div>
        </>
      )}

      {/* FOG / MIST */}
      {isMist && (
        <>
          <div className="fog fog1"></div>
          <div className="fog fog2"></div>
          <div className="fog fog3"></div>
        </>
      )}

      {/* RAIN */}
      {isRain && (
        <div className="rain-container">
          {Array.from({ length: 450 }).map((_, index) => (
            <span
              key={index}
              className="drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.55 + Math.random() * 0.5}s`,
                opacity: 0.55 + Math.random() * 0.45,
              }}
            />
          ))}
        </div>
      )}

      {/* SNOW */}
      {isSnow && (
        <div className="snow-container">
          {Array.from({ length: 100 }).map((_, index) => (
            <span
              key={index}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${6 + Math.random() * 6}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* LIGHTNING */}
      {isStorm && (
        <div className="lightning"></div>
      )}

      {/* NIGHT STARS */}
      {!isDay && (
        <>
          {Array.from({ length: 45 }).map((_, index) => (
            <span
              key={index}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </>
      )}

    </div>
  );
}

export default WeatherEffects;