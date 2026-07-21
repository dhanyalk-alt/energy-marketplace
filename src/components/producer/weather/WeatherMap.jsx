import "./WeatherMap.css";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  return null;
}
function WeatherMap({
  weather,
  place,
  latitude,
  longitude,
}) {
  if (!weather || latitude == null || longitude == null) return null;

  return (
    <div className="weather-map-section">

      <h2 className="map-title">
        🗺 Weather Map
      </h2>

      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={true}
        className="weather-map"
      >

  <ResizeMap />

  
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[latitude, longitude]}>
          <Popup>

            <h3>
  {place?.village}, {place?.state}
</h3>

            <p>
              🌡 {Math.round(weather.current.temp_c)}°C
            </p>

            <p>
              {weather.current.condition.text}
            </p>

            <p>
              💨 {weather.current.wind_kph} km/h
            </p>

          </Popup>
        </Marker>

      </MapContainer>

    </div>
  );
}

export default WeatherMap;