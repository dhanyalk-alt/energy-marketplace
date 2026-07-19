import axios from "axios";

export const getLocationName = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );

    return response.data;
  } catch (error) {
    console.error("Location API Error:", error);
    throw error;
  }
};