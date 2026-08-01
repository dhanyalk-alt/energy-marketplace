export function getAQILevel(index) {
  switch (index) {
    case 1:
      return "Good";

    case 2:
      return "Moderate";

    case 3:
      return "Unhealthy for Sensitive";

    case 4:
      return "Unhealthy";

    case 5:
      return "Very Unhealthy";

    case 6:
      return "Hazardous";

    default:
      return "Unknown";
  }
}

export function getAQIColor(index) {
  switch (index) {
    case 1:
      return "#34A853";

    case 2:
      return "#FBBC05";

    case 3:
      return "#F29900";

    case 4:
      return "#EA4335";

    case 5:
      return "#A142F4";

    case 6:
      return "#6D4C41";

    default:
      return "#9E9E9E";
  }
}