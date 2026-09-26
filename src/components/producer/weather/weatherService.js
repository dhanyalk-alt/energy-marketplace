import axios from "axios";
import { API_BASE_URL } from "../../../config";

export const getWeatherData = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/weather/forecast`,
      {
        params: {
          latitude,
          longitude,
          days: 7,
        },
        headers: (() => {
          const token = localStorage.getItem("energy_marketplace_jwt");
          return token ? { Authorization: `Bearer ${token}` } : {};
        })(),
      }
    );

    return response.data;
  } catch (error) {
    console.error("Weather API Error:", error);
    throw error;
  }
};
