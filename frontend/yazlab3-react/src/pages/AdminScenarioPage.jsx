import { useState } from "react";
import React from "react"; // Added React import for Fragment
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = ['blue', 'red', 'green', 'purple', 'orange'];

function AdminScenarioPage() {
  const [scenarioId, setScenarioId] = useState(1);
  const [unlimited, setUnlimited] = useState(false);
  const [result, setResult] = useState(null);

  async function runScenario() {
    try {
      const response = await fetch("http://localhost:5014/api/admin/run-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          unlimitedVehicles: unlimited,
        }),
      });

      const text = await response.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { error: text }; }

      if (!response.ok) {
        setResult({ error: parsed });
        return;
      }
      setResult(parsed); 
    } catch (err) {
      setResult({ error: String(err) });
    }
  }

  // Center on Kocaeli
  const mapCenter = [40.765, 29.940];

  return (
    <div style={{ width: "100%", padding: "20px", boxSizing: "border-box" }}>
      <h2>Admin – Scenario Runner</h2>

      <div style={{ marginBottom: 20 }}>
        <select 
          value={scenarioId} 
          onChange={(e) => setScenarioId(Number(e.target.value))}
          style={{ padding: "5px", fontSize: "16px" }}
        >
          <option value={1}>Scenario 1</option>
          <option value={2}>Scenario 2</option>
          <option value={3}>Scenario 3</option>
          <option value={4}>Scenario 4</option>
        </select>
        
        <label style={{ marginLeft: 20, fontSize: "16px", cursor: "pointer" }}>
          <input 
            type="checkbox" 
            checked={unlimited} 
            onChange={(e) => setUnlimited(e.target.checked)} 
            style={{ marginRight: "5px" }}
          />
          Unlimited Vehicles
        </label>
        
        <button 
          onClick={runScenario} 
          style={{ marginLeft: 20, padding: "5px 15px", fontSize: "16px", cursor: "pointer" }}
        >
          Run Scenario
        </button>
      </div>

      {/* --- MAP SECTION --- */}
      <div style={{ height: "75vh", width: "100%", border: "2px solid #555", borderRadius: "8px", overflow: "hidden" }}>
        <MapContainer center={mapCenter} zoom={10} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {Array.isArray(result) && result.map((route, idx) => {
            const color = COLORS[idx % COLORS.length];

            // FIX: Used React.Fragment instead of <group>
            return (
              <React.Fragment key={route.vehicleId}>
                {/* 1. The Full Zig-Zag Path */}
                {route.pathCoordinates && route.pathCoordinates.length > 0 && (
                  <Polyline 
                    positions={route.pathCoordinates} 
                    pathOptions={{ color: color, weight: 5 }} 
                  />
                )}

                {/* 2. The Stops (Markers) */}
                {route.route.map((stop) => (
                  <Marker 
                    key={stop.stationId} 
                    position={[stop.latitude, stop.longitude]}
                  >
                    <Popup>
                      <strong>{stop.stationName}</strong><br/>
                      Vehicle: {route.vehicleId}<br/>
                      Order: {stop.order}
                    </Popup>
                  </Marker>
                ))}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Debug Output */}
      {result && (
        <details style={{ marginTop: 20 }}>
          <summary>View Raw JSON</summary>
          <pre style={{ background: "#333", padding: "10px", borderRadius: "5px" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export default AdminScenarioPage;