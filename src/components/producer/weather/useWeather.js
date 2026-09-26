import { useEffect, useState } from "react";
import { getWeatherData } from "./weatherService";
import { getLocationName } from "./locationService";

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latitude, setLatitude] = useState(null);
const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    fetchWeather();

    // Keep the existing Forecasting screen current after it is opened. Once
    // permission has been granted, the browser supplies a fresh location so a
    // user who moves to another area sees that area's weather.
    const refreshId = window.setInterval(() => {
      fetchWeather();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(refreshId);
  }, []);

  const fetchWeather = () => {
    const loadWeather = async (lat, lon) => {
      try {
        setLoading(true);
        setError("");
        setLatitude(lat);
        setLongitude(lon);

        const weatherData = await getWeatherData(lat, lon);
        const locationData = await getLocationName(lat, lon);

        setWeather(weatherData);
        localStorage.setItem(
          "energy_marketplace_weather",
          JSON.stringify(weatherData)
        );

        setPlace({
          village:
            locationData.address.village ||
            locationData.address.suburb ||
            locationData.address.neighbourhood ||
            locationData.address.hamlet ||
            locationData.address.town ||
            locationData.address.city,
          state:
            locationData.address.state ||
            weatherData.location.region,
        });
      } catch (err) {
        console.error("Weather Fetch Error:", err);
        setError("Unable to fetch weather data.");
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => loadWeather(position.coords.latitude, position.coords.longitude),
      (err) => {
        console.error("Location Error:", err);
        setError("Location permission denied.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

return {
  weather,
  place,
  loading,
  error,
  refreshWeather: fetchWeather,
  latitude,
  longitude,
};
}
