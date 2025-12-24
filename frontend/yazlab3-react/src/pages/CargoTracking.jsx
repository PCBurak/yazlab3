import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "../styles/theme.css";

// Leaflet İkon Düzeltmesi
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr" }}>
          
          {/* SOL: KARGO LİSTESİ */}
          <Card className="card" style={{ height: "600px", overflowY: "auto" }}>
            <CardHeader>
              <CardTitle><i className="fa-solid fa-boxes-packing"></i> Gönderilerim</CardTitle>
            </CardHeader>
            <CardContent>
              {cargos.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center" }}>Henüz kargo gönderiniz yok.</p>
              ) : (
                <div className="cargo-list">
                  {cargos.map((cargo) => (
                    <div 
                      key={cargo.requestId} 
                      className={`cargo-item ${selectedCargo?.requestId === cargo.requestId ? "active-item" : ""}`}
                      onClick={() => setSelectedCargo(cargo)}
                      style={{
                        padding: "15px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        cursor: "pointer",
                        background: selectedCargo?.requestId === cargo.requestId ? "#eff6ff" : "white",
                        borderColor: selectedCargo?.requestId === cargo.requestId ? "#3b82f6" : "#e2e8f0"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontWeight: "bold", color: "#1e293b" }}>#{cargo.requestId} - {cargo.stationName}</span>
                        <span className={`badge ${cargo.status.includes("Yolda") ? "badge-type" : "badge-inactive"}`} 
                              style={{ fontSize: "11px", background: cargo.status.includes("Yolda") ? "#10b981" : "#f59e0b", color: "white" }}>
                          {cargo.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        <div><i className="fa-regular fa-calendar"></i> {cargo.date}</div>
                        <div><i className="fa-solid fa-weight-hanging"></i> {cargo.weight} kg</div>
                        {cargo.vehicleId && <div><i className="fa-solid fa-truck"></i> Araç No: {cargo.vehicleId}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SAĞ: HARİTA */}
          <Card className="card map-section" style={{ height: "600px", padding: 0, overflow: "hidden" }}>
             <MapContainer center={[40.765, 29.940]} zoom={10} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {selectedCargo && selectedCargo.routePath ? (
                    <>
                        {/* Rota Çizgisi */}
                        <Polyline 
                            positions={selectedCargo.routePath.map(p => [p.lat, p.lng])}
                            pathOptions={{ color: "#2563eb", weight: 6 }} 
                        />
                        {/* Rota Üzerindeki Duraklar */}
                        {selectedCargo.routePath.map((pos, idx) => (
                             <Marker key={idx} position={[pos.lat, pos.lng]}>
                                <Popup>Durak {idx + 1}</Popup>
                             </Marker>
                        ))}
                    </>
                ) : (
                    // Seçili kargo yoksa veya yolda değilse varsayılan merkez
                    <Marker position={[40.765, 29.940]}>
                        <Popup>Kocaeli Merkez</Popup>
                    </Marker>
                )}
             </MapContainer>
             
             {!selectedCargo && (
                 <div className="map-overlay-info">
                     Haritada görmek için listeden bir kargo seçin.
                 </div>
             )}
          </Card>
        </div>
      </main>
    </div>
  );
}