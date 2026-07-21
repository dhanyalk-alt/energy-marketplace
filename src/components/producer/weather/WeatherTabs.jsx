import "./WeatherTabs.css";

function WeatherTabs({ selectedTab, setSelectedTab }) {
  const tabs = [
    {
      id: "temperature",
      label: "Temperature",
    },
    {
      id: "precipitation",
      label: "Precipitation",
    },
    {
      id: "wind",
      label: "Wind",
    },
  ];

  return (
    <div className="weather-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${
            selectedTab === tab.id ? "active" : ""
          }`}
          onClick={() => setSelectedTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default WeatherTabs;
