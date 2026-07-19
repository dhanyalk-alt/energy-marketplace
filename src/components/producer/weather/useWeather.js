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
  }, []);

  const fetchWeather = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
setLatitude(lat);
setLongitude(lon);
          // Fetch weather data
          const weatherData = await getWeatherData(lat, lon);

          // Fetch location name
          const locationData = await getLocationName(lat, lon);

          setWeather(weatherData);

setPlace({
  village:
   locationData.address.village ||
locationData.address.suburb ||
locationData.address.neighbourhood ||
locationData.address.hamlet ||
locationData.address.city,
   

  state:
    locationData.address.state ||
    weatherData.location.region,
});

          setLoading(false);
        } catch (err) {
          console.error("Weather Fetch Error:", err);
          setError("Unable to fetch weather data.");
          setLoading(false);
        }
      },
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