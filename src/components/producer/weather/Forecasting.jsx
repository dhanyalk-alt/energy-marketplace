import "./Forecasting.css";
import { useState } from "react";

import CurrentWeather from "./CurrentWeather";
import WeatherTabs from "./WeatherTabs";
import WeatherChart from "./WeatherChart";
import { useWeather } from "./useWeather";
import ForecastCards from "./ForecastCards";
import WeatherDetails from "./WeatherDetails";
import EnergyInsights from "./EnergyInsights";


function Forecasting() {
 const {
  weather,
  place,
  loading,
  error,
  latitude,
  longitude,
} = useWeather();
  const [selectedTab, setSelectedTab] = useState("temperature");
  const [selectedDay, setSelectedDay] = useState(0);

  if (loading) {
    return (
      <div className="forecasting-container">
        <h2>Loading weather...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forecasting-container">
        <h2>{error}</h2>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="forecasting-container">
        <h2>No weather data available.</h2>
      </div>
    );
  }

  return (
    <div className="forecasting-container">
       
      <CurrentWeather
        weather={weather}
        place={place}
      ></CurrentWeather>
      

      <WeatherTabs
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />

<WeatherChart
    weather={weather}
    selectedTab={selectedTab}
    selectedDay={selectedDay}
/>
<ForecastCards
    weather={weather}
    selectedDay={selectedDay}
    setSelectedDay={setSelectedDay}
/>
      <section className="weather-energy-summary">
        <h2 className="weather-energy-summary-title">
          Today&apos;s Highlights &amp; Energy Insights
        </h2>
        <WeatherDetails weather={weather} showTitle={false} />
        <EnergyInsights weather={weather} showTitle={false} />
      </section>
    </div>
  );
}

export default Forecasting;
