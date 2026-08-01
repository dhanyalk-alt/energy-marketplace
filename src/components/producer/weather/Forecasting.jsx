import "./Forecasting.css";
import { useState } from "react";

import CurrentWeather from "./CurrentWeather";
import WeatherTabs from "./WeatherTabs";
import WeatherChart from "./WeatherChart";
import { useWeather } from "./useWeather";
import ForecastCards from "./ForecastCards";
import WeatherDetails from "./WeatherDetails";
import EnergyInsights from "./EnergyInsights";
import WeatherMap from "./WeatherMap";


function Forecasting() {
 const {
  weather,
  place,
  loading,
  error,
  latitude,
  longitude,
} = useWeather();
console.log(latitude, longitude);
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
<WeatherDetails weather={weather} />
<EnergyInsights weather={weather} />
<WeatherMap
  weather={weather}
  place={place}
  latitude={latitude}
  longitude={longitude}
/>
    </div>
  );
}

export default Forecasting;