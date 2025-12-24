import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Sidebar from "../components/ui/Sidebar"; // Sidebar'ı doğru yerden import ettik

// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = ['blue', 'red', 'green', 'purple', 'orange'];

export default function AdminDashboard({ onLogout }) {
  // --- STATE ---
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scenarioId, setScenarioId] = useState(1);
  const [unlimited, setUnlimited] = useState(false);

  // --- API LOGIC ---
  async function runScenario() {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5014/api/admin/run-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, unlimitedVehicles: unlimited }),
      });
      
      const data = await response.json();
      if (!response.ok) alert("Hata oluştu: " + (data.message || "Bilinmeyen hata"));
      else setResult(data); 
    } catch (err) {
      alert("Sunucuya bağlanılamadı.");
    }
    setLoading(false);
  }

  // --- HESAPLAMALAR ---
  const vehiclesData = Array.isArray(result) ? result : [];
  const totalVehicles = vehiclesData.length;
  const totalCost = vehiclesData.reduce((sum, v) => sum + v.totalCost, 0).toLocaleString();
  const totalRoutes = vehiclesData.reduce((sum, v) => sum + (v.route ? v.route.length : 0), 0);
  const totalDistance = vehiclesData.reduce((sum, v) => sum + v.totalDistanceKm, 0).toFixed(1);

  return (
    <div className="dashboard-container">
      {/* 1. SIDEBAR */}
      {/* ÖNEMLİ: role="Admin" parametresini ekledim, menüler görünsün diye */}
      <aside className="modern-sidebar">
        <div className="sidebar-logo">
           <div className="logo-icon">L</div>
           <span>LOGI-TECH</span>
        </div>
        <Sidebar role="Admin" onLogout={onLogout} />
      </aside>

      <main className="main-content">
        {/* HEADER & CONTROLS */}
        <header className="content-header">
          <div>
            <h1>Genel Bakış</h1>
            <p className="subtitle">Sistemdeki güncel lojistik verileri ve araç durumları.</p>
          </div>
          
          {/* SCENARIO CONTROLS */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select 
              className="modern-select" 
              style={{ width: "150px" }}
              value={scenarioId} 
              onChange={(e) => setScenarioId(Number(e.target.value))}
            >
              <option value={1}>Senaryo 1</option>
              <option value={2}>Senaryo 2</option>
              <option value={3}>Senaryo 3</option>
              <option value={4}>Senaryo 4</option>
            </select>

            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "14px", color: "#64748b" }}>
              <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
              Sınırsız
            </label>

            <button className="modern-submit-btn" style={{ width: "auto", padding: "0 20px" }} onClick={runScenario}>
              {loading ? "Hesaplanıyor..." : "Verileri Getir"}
            </button>
          </div>
        </header>

        {/* 2. STATS GRID */}
        <section className="stats-grid">
          <div className="card stat-card">
            <div className="p-4">
              <div className="stat-icon purple"><i className="fas fa-truck-fast"></i></div>
              <div className="stat-info"><p>Toplam Araç</p><h3>{totalVehicles}</h3></div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="p-4">
              <div className="stat-icon green"><i className="fas fa-route"></i></div>
              <div className="stat-info"><p>Toplam Mesafe</p><h3>{totalDistance} km</h3></div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="p-4">
              <div className="stat-icon orange"><i className="fas fa-lira-sign"></i></div>
              <div className="stat-info"><p>Toplam Maliyet</p><h3>₺ {totalCost}</h3></div>
            </div>
          </div>
        </section>

        {/* 3. DASHBOARD GRID (MAP & TABLE) */}
        <div className="dashboard-grid">
          
          {/* MAP SECTION */}
          <div className="card map-section" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="map-wrapper">
               <MapContainer center={[40.765, 29.940]} zoom={10} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  
                  {vehiclesData.map((route, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    return (
                      <React.Fragment key={route.vehicleId || idx}>
                        {route.pathCoordinates && <Polyline positions={route.pathCoordinates} pathOptions={{ color, weight: 5 }} />}
                        {route.route.map((stop) => (
                          <Marker key={stop.stationId} position={[stop.latitude, stop.longitude]}>
                            <Popup>
                              <strong>{stop.stationName}</strong><br/>
                              Araç: #{route.vehicleId}<br/>
                              Sıra: {stop.order}
                            </Popup>
                          </Marker>
                        ))}
                      </React.Fragment>
                    );
                  })}
               </MapContainer>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="card table-section" style={{ display: 'flex', flexDirection: 'column', height: '550px' }}>
            <div style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Son Rota Detayları</h3>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "0 15px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Araç ID</th>
                    <th>Durak Sayısı</th>
                    <th>Maliyet</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesData.map((v, i) => (
                    <tr key={i}>
                      <td>
                        <span className="badge-type" style={{ color: COLORS[i % COLORS.length] }}>
                          #{v.vehicleId}
                        </span>
                      </td>
                      <td>{v.route ? v.route.length : 0} Durak</td>
                      <td>₺{v.totalCost}</td>
                    </tr>
                  ))}
                  {vehiclesData.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: "center", color: "#999", padding: "20px" }}>Henüz veri yok. Lütfen "Verileri Getir" butonuna basın.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}