import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "../styles/theme.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapHandler({ selectedCargo }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    if (selectedCargo && selectedCargo.routePath && selectedCargo.routePath.length > 0) {
      const bounds = L.latLngBounds(selectedCargo.routePath.map(p => [p.lat, p.lng]));
      
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.flyTo([40.765, 29.940], 10);
    }

    return () => clearTimeout(timer);
  }, [map, selectedCargo]);

  return null;
}

export default function CargoTracking({ onLogout }) {
  const [cargos, setCargos] = useState([]);
  const [selectedCargo, setSelectedCargo] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      fetch(`http://localhost:5014/api/cargo/my-requests/${user.id}`)
        .then(res => res.json())
        .then(data => setCargos(data))
        .catch(err => console.error("Kargo verisi çekilemedi:", err));
    }
  }, []);

  return (
    <div className="dashboard-container">
      <aside className="modern-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          <span>LOGI-TECH</span>
        </div>
        <Sidebar role="User" onLogout={onLogout} />
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>Kargo Takip</h1>
            <p className="subtitle">Gönderilerinizin durumunu ve araç konumunu canlı izleyin.</p>
          </div>
        </header>

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr", height: "calc(100vh - 140px)" }}>
          
          <Card className="card" style={{ height: "100%", overflowY: "auto" }}>
            <CardHeader>
              <CardTitle><i className="fa-solid fa-boxes-packing"></i> Gönderilerim</CardTitle>
            </CardHeader>
            <CardContent>
              {cargos.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "20px" }}>Henüz kargo gönderiniz yok.</p>
              ) : (
                <div className="cargo-list">
                  {cargos.map((cargo) => (
                    <div 
                      key={cargo.requestId} 
                      className={`cargo-item ${selectedCargo?.requestId === cargo.requestId ? "active-item" : ""}`}
                      onClick={() => setSelectedCargo(cargo)}
                      style={{
                        padding: "15px",
                        border: selectedCargo?.requestId === cargo.requestId ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        cursor: "pointer",
                        background: selectedCargo?.requestId === cargo.requestId ? "#eff6ff" : "white",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontWeight: "bold", color: "#1e293b" }}>#{cargo.requestId} - {cargo.stationName}</span>
                        <span className={`badge`} 
                              style={{ 
                                fontSize: "11px", 
                                padding: "4px 8px", 
                                borderRadius: "4px",
                                background: cargo.status.includes("Yolda") ? "#10b981" : "#f59e0b", 
                                color: "white" 
                              }}>
                          {cargo.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        <div><i className="fa-regular fa-calendar" style={{width: 20}}></i> {cargo.date}</div>
                        <div><i className="fa-solid fa-weight-hanging" style={{width: 20}}></i> {cargo.weight} kg</div>
                        {cargo.vehicleId && <div><i className="fa-solid fa-truck" style={{width: 20}}></i> Araç No: {cargo.vehicleId}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card map-section" style={{ height: "100%", padding: 0, overflow: "hidden", position: "relative" }}>
             <MapContainer center={[40.765, 29.940]} zoom={10} style={{ height: "100%", width: "100%" }}>
                
                <MapHandler selectedCargo={selectedCargo} />
                
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {selectedCargo && selectedCargo.routePath ? (
                    <>
                        <Polyline 
                            positions={selectedCargo.routePath.map(p => [p.lat, p.lng])}
                            pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.8 }} 
                        />
                        {selectedCargo.routePath.map((pos, idx) => (
                             <Marker key={idx} position={[pos.lat, pos.lng]}>
                                <Popup>Durak {idx + 1}</Popup>
                             </Marker>
                        ))}
                    </>
                ) : (
                    <Marker position={[40.765, 29.940]}>
                        <Popup>Kocaeli Merkez</Popup>
                    </Marker>
                )}
             </MapContainer>
             
             {!selectedCargo && (
                 <div style={{
                     position: "absolute",
                     bottom: 20,
                     left: "50%",
                     transform: "translateX(-50%)",
                     background: "rgba(255,255,255,0.9)",
                     padding: "10px 20px",
                     borderRadius: "20px",
                     boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                     zIndex: 1000,
                     pointerEvents: "none",
                     fontWeight: "500",
                     color: "#64748b"
                 }}>
                     Haritada görmek için listeden bir kargo seçin.
                 </div>
             )}
          </Card>
        </div>
      </main>
    </div>
  );
}