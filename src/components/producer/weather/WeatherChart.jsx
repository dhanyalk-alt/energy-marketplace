import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

import "./WeatherChart.css";

function WeatherChart({
    weather,
    selectedTab,
    selectedDay,
}) {
  if (!weather) return null;

 const hourly = weather.forecast.forecastday[selectedDay].hour;

  // Show data every 3 hours
  const data = hourly
    .filter((_, index) => index % 3 === 0)
    .map((hour) => ({
      time: new Date(hour.time).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      }),
      temp: Math.round(hour.temp_c),
      rain: hour.chance_of_rain,
      wind: Math.round(hour.wind_kph),
      icon: `https:${hour.condition.icon}`,
      condition: hour.condition.text,
    }));

  let dataKey = "temp";
  let stroke = "#F9AB00";
  let gradient = "tempGradient";
  let unit = "°C";
  let title = "Temperature";

  if (selectedTab === "precipitation") {
    dataKey = "rain";
    stroke = "#4285F4";
    gradient = "rainGradient";
    unit = "%";
    title = "Precipitation";
  }

  if (selectedTab === "wind") {
    dataKey = "wind";
    stroke = "#34A853";
    gradient = "windGradient";
    unit = " km/h";
    title = "Wind";
  }

  return (
    <div className="weather-chart">

      <h3 className="chart-title">{title}</h3>

      {/* Weather Icons */}
      <div className="weather-icons-row">
        {data.map((item, index) => (
          <div key={index} className="weather-icon-item">
            <img src={item.icon} alt={item.condition} />
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{
            top: 35,
            right: 20,
            left: 20,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient
              id="tempGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#F9AB00" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#F9AB00" stopOpacity={0} />
            </linearGradient>

            <linearGradient
              id="rainGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#4285F4" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#4285F4" stopOpacity={0} />
            </linearGradient>

            <linearGradient
              id="windGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#34A853" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#34A853" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            horizontal={false}
          />

          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            interval={0}
            minTickGap={0}
            padding={{
              left: 15,
              right: 15,
            }}
            tick={{
              fontSize: 13,
              fill: "#5f6368",
            }}
          />

          <YAxis hide />

          <Tooltip
            formatter={(value) => [`${value}${unit}`, title]}
          />

          <Area
            type="natural"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={3}
            fill={`url(#${gradient})`}
            dot={false}
            activeDot={{
              r: 5,
            }}
          >
            <LabelList
              dataKey={dataKey}
              position="top"
              offset={12}
              formatter={(value) =>
                selectedTab === "temperature"
                  ? `${value}°`
                  : `${value}${unit}`
              }
              style={{
                fill: "#5f6368",
                fontSize: 13,
                fontWeight: 600,
              }}
            />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WeatherChart;