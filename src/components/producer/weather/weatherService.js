import axios from "axios";

const API_KEY = "YOUR_WEATHER_API_KEY"; // Replace with your actual WeatherAPI key  

const BASE_URL = "https://api.weatherapi.com/v1";
export const getWeatherData = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/forecast.json`,
      {
        params: {
          key: API_KEY,
          q: `${latitude},${longitude}`,
          days: 7,
          aqi: "yes",
          alerts: "yes",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Weather API Error:", error);
    throw error;
  }
};