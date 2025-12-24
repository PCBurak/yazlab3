import React, { useState } from "react";
import Sidebar from "../components/ui/Sidebar";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "../styles/theme.css";

// Leaflet İkon Hatası Çözümü
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c'];

export default function RoutePlanning({ onLogout }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // PDF İsteri: Sınırsız veya Belirli Sayıda Araç Seçimi [cite: 29, 32]
  const [mode, setMode] = useState("unlimited"); // 'unlimited' or 'fixed'

  async function handlePlanRoutes() {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5014/api/admin/plan-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            unlimitedVehicles: mode === "unlimited" 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Planlama hatası");
      } else {
        setResult(data);
      }
    } catch (err) {
      alert("Sunucu hatası: " + err);
    }
    setLoading(false);
  }

  // İstatistikler
  const totalCost = result ? result.reduce((acc, r) => acc + r.totalCost, 0) : 0;
  const totalVehicles = result ? result.length : 0;
  const totalDistance = result ? result.reduce((acc, r) => acc + r.totalDistanceKm, 0) : 0;

  return (
    <div className="dashboard-container">
      <aside className="modern-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          <span>LOGI-TECH</span>
        </div>
        {/* Rota Planlama sayfasında olduğumuzu belirtmek için active path verebiliriz ama Sidebar otomatik algılıyor */}
        <Sidebar role="Admin" onLogout={onLogout} />
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>Rota Planlama</h1>
            <p className="subtitle">
                Algoritma, bekleyen kargoları optimize ederek araçlara dağıtır.
            </p>
          </div>
        </header>

        {/* --- KONTROL PANELİ --- */}
        <div className="card" style={{ marginBottom: "20px", padding: "20px" }}>
            <div style={{ display: "flex", gap: "20px", alignItems: "end" }}>
                
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#1e293b" }}>
                        Optimizasyon Modu [cite: 29, 32]
                    </label>
                    <select 
                        className="modern-select"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                    >
                        <option value="unlimited">Sınırsız Araç (Maliyet Odaklı - Kiralama Dahil)</option>
                        <option value="fixed">Sabit 3 Araç (Kapasite Odaklı - Max Kargo)</option>
                    </select>
                </div>

                <button 
                    className="modern-submit-btn" 
                    style={{ width: "200px", height: "46px" }}
                    onClick={handlePlanRoutes}
                    disabled={loading}
                >
                    {loading ? (
                        <span><i className="fas fa-spinner fa-spin"></i> Hesaplanıyor...</span>
                    ) : (
                        <span><i className="fas fa-calculator"></i> Rotayı Hesapla</span>
                    )}
                </button>
            </div>
        </div>

        {/* --- SONUÇLAR --- */}
        {result && (
            <>
                {/* İSTATİSTİK KARTLARI  */}
                <section className="stats-grid">
                    <div className="card stat-card">
                        <div className="p-4">
                            <div className="stat-icon purple"><i className="fas fa-truck"></i></div>
                            <div className="stat-info"><p>Kullanılan Araç</p><h3>{totalVehicles}</h3></div>
                        </div>
                    </div>
                    <div className="card stat-card">
                        <div className="p-4">
                            <div className="stat-icon orange"><i className="fas fa-lira-sign"></i></div>
                            <div className="stat-info"><p>Toplam Maliyet</p><h3>₺ {totalCost.toFixed(2)}</h3></div>
                        </div>
                    </div>
                    <div className="card stat-card">
                        <div className="p-4">
                            <div className="stat-icon green"><i className="fas fa-road"></i></div>
                            <div className="stat-info"><p>Toplam Mesafe</p><h3>{totalDistance.toFixed(1)} km</h3></div>
                        </div>
                    </div>
                </section>

                <div className="dashboard-grid">
                    {/* HARİTA  */}
                    <div className="card map-section" style={{ padding: 0, overflow: 'hidden', height: "600px" }}>
                        <MapContainer center={[40.765, 29.940]} zoom={10} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {result.map((route, idx) => {
                                const color = COLORS[idx % COLORS.length];
                                return (
                                    <React.Fragment key={idx}>
                                        {/* Rota Çizgisi */}
                                        {route.pathCoordinates && (
                                            <Polyline 
                                                positions={route.pathCoordinates} 
                                                pathOptions={{ color, weight: 5, opacity: 0.8 }} 
                                            />
                                        )}
                                        {/* Duraklar */}
                                        {route.route.map((stop, i) => (
                                            <Marker key={i} position={[stop.latitude, stop.longitude]}>
                                                <Popup>
                                                    <strong>{stop.stationName}</strong><br/>
                                                    Sıra: {stop.order}<br/>
                                                    Araç: {route.vehicleId}
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </MapContainer>
                    </div>

                    {/* DETAY TABLOSU  */}
                    <div className="card table-section" style={{ height: "600px", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                            <h3 style={{ margin: 0, fontSize: "18px" }}>Araç Detayları</h3>
                        </div>
                        <div style={{ overflowY: "auto", flex: 1, padding: "0 15px" }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Araç</th>
                                        <th>Duraklar</th>
                                        <th>Maliyet</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.map((r, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: "bold", color: COLORS[i % COLORS.length] }}>
                                                #{r.vehicleId}
                                            </td>
                                            <td style={{ fontSize: "13px" }}>
                                                {r.route.map(s => s.stationName).join(" ➝ ")}
                                            </td>
                                            <td>₺{r.totalCost.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}