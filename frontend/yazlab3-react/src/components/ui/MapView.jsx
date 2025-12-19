import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const route = [
  [40.765, 29.940],
  [40.802, 29.430],
  [40.772, 29.400]
];

export default function MapView() {
  return (
    <MapContainer
      center={[40.76, 29.85]}
      zoom={10}
      style={{ height: "350px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={route} color="blue" />
    </MapContainer>
  );
}
