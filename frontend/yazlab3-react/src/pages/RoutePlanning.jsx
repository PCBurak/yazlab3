import React, { useState } from "react";
import Sidebar from "../components/ui/Sidebar";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "../styles/theme.css";

// --- Leaflet Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#eab308', '#06b6d4'];

export default function RoutePlanning({ onLogout }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // --- STATE ---
  const [mode, setMode] = useState("unlimited"); // 'unlimited' | 'fixed'
  const [strategy, setStrategy] = useState(0);   // 0: Max Weight, 1: Max Count

  async function handlePlanRoutes() {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5014/api/admin/plan-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            unlimitedVehicles: mode === "unlimited",
            strategy: strategy // Backend bu parametreyi bekliyor
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

  // --- İSTATİSTİKLER ---
  const totalCost = result ? result.reduce((acc, r) => acc + r.totalCost, 0) : 0;
  const totalVehicles = result ? result.length : 0;
  const totalDistance = result ? result.reduce((acc, r) => acc + r.totalDistanceKm, 0) : 0;

  // --- STİL YARDIMCILARI ---
  const getCardStyle = (isSelected) => ({
    flex: 1,
    padding: "20px",
    borderRadius: "12px",
    border: isSelected ? "2px solid #4f46e5" : "2px solid #e2e8f0",
    backgroundColor: isSelected ? "#eef2ff" : "white",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    textAlign: "center",
    opacity: loading ? 0.7 : 1
  });

  return (
    <div className="dashboard-container">
      <aside className="modern-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          <span>LOGI-TECH</span>
        </div>
        <Sidebar role="Admin" onLogout={onLogout} />
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>Rota Optimizasyonu</h1>
            <p className="subtitle">Lojistik filonuz için en verimli dağıtım planını oluşturun.</p>
          </div>
        </header>

        {/* --- YENİ MODERN KONTROL PANELİ --- */}
        <div className="card" style={{ marginBottom: "25px", padding: "30px" }}>
            
            <h3 style={{fontSize: "18px", color: "#1e293b", marginBottom: "20px", borderBottom:"1px solid #eee", paddingBottom:"10px"}}>
                <i className="fas fa-sliders-h" style={{marginRight: 10, color: "#64748b"}}></i>
                Planlama Ayarları
            </h3>

            {/* 1. SEÇİM: FİLO MODU */}
            <div style={{ marginBottom: "30px" }}>
                <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#475569" }}>
                    1. Filo Modu Seçimi
                </label>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    
                    {/* CARD: UNLIMITED */}
                    <div 
                        style={getCardStyle(mode === "unlimited")}
                        onClick={() => setMode("unlimited")}
                    >
                        <div style={{ fontSize: "28px", color: mode === "unlimited" ? "#4f46e5" : "#94a3b8" }}>
                            <i className="fas fa-infinity"></i>
                        </div>
                        <div>
                            <strong style={{ display: "block", fontSize: "16px", color: "#1e293b" }}>Sınırsız Araç</strong>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>Maliyet Odaklı • Otomatik Kiralama</span>
                        </div>
                    </div>

                    {/* CARD: FIXED */}
                    <div 
                        style={getCardStyle(mode === "fixed")}
                        onClick={() => setMode("fixed")}
                    >
                        <div style={{ fontSize: "28px", color: mode === "fixed" ? "#4f46e5" : "#94a3b8" }}>
                            <i className="fas fa-truck-loading"></i>
                        </div>
                        <div>
                            <strong style={{ display: "block", fontSize: "16px", color: "#1e293b" }}>Sabit Filo (3 Araç)</strong>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>Kapasite Odaklı • Kiralama Yok</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. SEÇİM: STRATEJİ (Sadece Fixed Modunda Görünür) */}
            {mode === "fixed" && (
                <div style={{ marginBottom: "30px", animation: "fadeIn 0.5s ease" }}>
                    <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#475569" }}>
                        2. Öncelik Stratejisi <span style={{fontSize: "12px", fontWeight: 400, color:"#ef4444"}}>(Kapasite yetersiz kalırsa hangisi öncelikli?)</span>
                    </label>
                    <div style={{ display: "flex", gap: "15px" }}>
                        <button 
                            className={`modern-btn ${strategy === 0 ? 'active-strategy' : ''}`}
                            style={{
                                flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                                background: strategy === 0 ? "#4f46e5" : "white",
                                color: strategy === 0 ? "white" : "#64748b",
                                cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
                            }}
                            onClick={() => setStrategy(0)}
                        >
                            <i className="fas fa-weight-hanging"></i> Maksimum Ağırlık
                        </button>

                        <button 
                            className={`modern-btn ${strategy === 1 ? 'active-strategy' : ''}`}
                            style={{
                                flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                                background: strategy === 1 ? "#4f46e5" : "white",
                                color: strategy === 1 ? "white" : "#64748b",
                                cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
                            }}
                            onClick={() => setStrategy(1)}
                        >
                            <i className="fas fa-boxes"></i> Maksimum Adet
                        </button>
                    </div>
                </div>
            )}

            {/* HESAPLA BUTONU */}
            <div style={{ textAlign: "right", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
                <button 
                    className="modern-submit-btn" 
                    style={{ width: "250px", height: "50px", fontSize: "16px", borderRadius: "8px" }}
                    onClick={handlePlanRoutes}
                    disabled={loading}
                >
                    {loading ? (
                        <span><i className="fas fa-spinner fa-spin"></i> Algoritma Çalışıyor...</span>
                    ) : (
                        <span><i className="fas fa-rocket" style={{ marginRight: 8 }}></i> Rotayı Hesapla</span>
                    )}
                </button>
            </div>
        </div>

        {/* --- SONUÇLAR (AYNI KALDI) --- */}
        {result && (
            <div style={{ animation: "slideUp 0.5s ease" }}>
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
                    <div className="card map-section" style={{ padding: 0, overflow: 'hidden', height: "600px" }}>
                        <MapContainer center={[40.765, 29.940]} zoom={10} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {result.map((route, idx) => {
                                const color = COLORS[idx % COLORS.length];
                                const stops = route.route || route.routeStations || [];
                                return (
                                    <React.Fragment key={idx}>
                                        {route.pathCoordinates && route.pathCoordinates.length > 0 && (
                                            <Polyline positions={route.pathCoordinates} pathOptions={{ color, weight: 5, opacity: 0.8 }} />
                                        )}
                                        {stops.map((stop, i) => (
                                            <Marker key={i} position={[stop.latitude || stop.station?.latitude, stop.longitude || stop.station?.longitude]}>
                                                <Popup>
                                                    <strong>{stop.stationName || stop.station?.name}</strong><br/>
                                                    Sıra: {stop.order}<br/> Araç: {route.vehicleId}
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </MapContainer>
                    </div>

                    <div className="card table-section" style={{ height: "600px", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                            <h3 style={{ margin: 0, fontSize: "18px" }}>Araç Detayları</h3>
                        </div>
                        <div style={{ overflowY: "auto", flex: 1, padding: "0 15px" }}>
                            <table className="modern-table">
                                <thead>
                                    <tr><th>Araç</th><th>Duraklar</th><th>Maliyet</th></tr>
                                </thead>
                                <tbody>
                                    {result.map((r, i) => {
                                        const stops = r.route || r.routeStations || [];
                                        return (
                                            <tr key={i}>
                                                <td style={{ fontWeight: "bold", color: COLORS[i % COLORS.length], whiteSpace: "nowrap" }}>
                                                    #{r.vehicleId}
                                                    <div style={{fontSize: "11px", color: "#666"}}>{r.vehicle?.name || "Kiralık"}</div>
                                                </td>
                                                <td style={{ fontSize: "13px" }}>{stops.map(s => s.stationName || s.station?.name).join(" ➝ ")}</td>
                                                <td style={{ whiteSpace: "nowrap" }}>₺{r.totalCost.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
      
      {/* Animasyon stilleri için ufak bir style bloğu */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}