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

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#06b6d4'];

export default function RoutePlanning({ onLogout }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { routes: [], rejectedCargos: [] }
  const [activeTab, setActiveTab] = useState("map"); // 'map' veya 'details'
  
  // Konfigürasyon State'i
  const [mode, setMode] = useState("unlimited");
  const [strategy, setStrategy] = useState(0);

  async function handlePlanRoutes() {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5014/api/admin/plan-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            unlimitedVehicles: mode === "unlimited",
            strategy: strategy 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Planlama hatası");
      } else {
        // Backend artık { routes: [...], rejectedCargos: [...] } dönüyor
        setResult(data);
        setActiveTab("map"); // Hesaplayınca haritayı aç
      }
    } catch (err) {
      alert("Sunucu hatası: " + err);
    }
    setLoading(false);
  }

  // --- İSTATİSTİKLER ---
  const routes = result?.routes || [];
  const rejected = result?.rejectedCargos || [];
  
  const totalCost = routes.reduce((acc, r) => acc + r.totalCost, 0);
  const totalVehicles = routes.length;
  const totalDistance = routes.reduce((acc, r) => acc + r.totalDistanceKm, 0);
  const totalRejectedWeight = rejected.reduce((acc, r) => acc + r.weight, 0);

  // --- Stil Yardımcıları ---
  const getCardStyle = (isSelected) => ({
    flex: 1, padding: "15px", borderRadius: "10px",
    border: isSelected ? "2px solid #4f46e5" : "1px solid #e2e8f0",
    backgroundColor: isSelected ? "#eef2ff" : "white",
    cursor: "pointer", transition: "all 0.2s", opacity: loading ? 0.7 : 1,
    display: "flex", alignItems: "center", gap: "10px"
  });

  return (
    <div className="dashboard-container">
      <aside className="modern-sidebar">
        <div className="sidebar-logo"><div className="logo-icon">L</div><span>LOGI-TECH</span></div>
        <Sidebar role="Admin" onLogout={onLogout} />
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>Rota Optimizasyonu</h1>
            <p className="subtitle">Yük dağıtımı, rota planlama ve filo yönetimi.</p>
          </div>
        </header>

        {/* --- 1. AYARLAR PANELİ (Kompakt Tasarım) --- */}
        <div className="card" style={{ marginBottom: "20px", padding: "20px" }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px"}}>
                <h3 style={{fontSize: "16px", margin: 0, color: "#334155"}}><i className="fas fa-cog"></i> Planlama Ayarları</h3>
            </div>
            
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {/* Sol: Mod Seçimi */}
                <div style={{ flex: 2, display: "flex", gap: "10px" }}>
                    <div style={getCardStyle(mode === "unlimited")} onClick={() => setMode("unlimited")}>
                        <i className="fas fa-infinity" style={{fontSize: "20px", color: mode==="unlimited"?"#4f46e5":"#94a3b8"}}></i>
                        <div><strong style={{display:"block", fontSize:"14px"}}>Sınırsız Araç</strong><span style={{fontSize:"11px", color:"#64748b"}}>Maliyet Odaklı</span></div>
                    </div>
                    <div style={getCardStyle(mode === "fixed")} onClick={() => setMode("fixed")}>
                        <i className="fas fa-truck-loading" style={{fontSize: "20px", color: mode==="fixed"?"#4f46e5":"#94a3b8"}}></i>
                        <div><strong style={{display:"block", fontSize:"14px"}}>Sabit Filo (3)</strong><span style={{fontSize:"11px", color:"#64748b"}}>Kapasite Odaklı</span></div>
                    </div>
                </div>

                {/* Orta: Strateji (Sadece Fixed ise) */}
                {mode === "fixed" && (
                    <div style={{ flex: 1.5, display: "flex", gap: "5px", animation: "fadeIn 0.3s" }}>
                        <button className={`modern-btn ${strategy===0?'active':''}`} onClick={()=>setStrategy(0)} style={{flex:1, fontSize:"12px", background: strategy===0?"#4f46e5":"#f1f5f9", color:strategy===0?"white":"#475569"}}>
                            Max Ağırlık
                        </button>
                        <button className={`modern-btn ${strategy===1?'active':''}`} onClick={()=>setStrategy(1)} style={{flex:1, fontSize:"12px", background: strategy===1?"#4f46e5":"#f1f5f9", color:strategy===1?"white":"#475569"}}>
                            Max Adet
                        </button>
                    </div>
                )}

                {/* Sağ: Buton */}
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                    <button className="modern-submit-btn" onClick={handlePlanRoutes} disabled={loading} style={{width: "100%", height: "100%"}}>
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : <span><i className="fas fa-route"></i> Hesapla</span>}
                    </button>
                </div>
            </div>
        </div>

        {/* --- 2. SONUÇ ALANI (Varsa Göster) --- */}
        {result && (
            <>
                {/* ÖZET KARTLARI */}
                <section className="stats-grid" style={{marginBottom: "20px"}}>
                    <div className="card stat-card"><div className="p-4"><div className="stat-info"><p>Araç Sayısı</p><h3>{totalVehicles}</h3></div><div className="stat-icon purple"><i className="fas fa-truck"></i></div></div></div>
                    <div className="card stat-card"><div className="p-4"><div className="stat-info"><p>Toplam Maliyet</p><h3>₺{totalCost.toFixed(0)}</h3></div><div className="stat-icon orange"><i className="fas fa-lira-sign"></i></div></div></div>
                    
                    {/* Eğer kalan yük varsa Kırmızı Kart Göster */}
                    {rejected.length > 0 ? (
                        <div className="card stat-card" style={{borderLeft: "4px solid #ef4444"}}>
                            <div className="p-4">
                                <div className="stat-info">
                                    <p style={{color: "#ef4444", fontWeight: "bold"}}>Taşınamayan Yük</p>
                                    <h3 style={{color: "#ef4444"}}>{totalRejectedWeight} kg</h3>
                                </div>
                                <div className="stat-icon" style={{background:"#fee2e2", color:"#ef4444"}}><i className="fas fa-times-circle"></i></div>
                            </div>
                        </div>
                    ) : (
                        <div className="card stat-card"><div className="p-4"><div className="stat-info"><p>Başarı Oranı</p><h3>%100</h3></div><div className="stat-icon green"><i className="fas fa-check"></i></div></div></div>
                    )}
                </section>

                {/* --- SEKMELİ YAPI (TABS) --- */}
                <div className="card" style={{ padding: "0", overflow: "hidden" }}>
                    {/* Tab Başlıkları */}
                    <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                        <button 
                            onClick={() => setActiveTab("map")}
                            style={{
                                flex: 1, padding: "15px", border: "none", background: activeTab === "map" ? "white" : "transparent",
                                borderBottom: activeTab === "map" ? "3px solid #4f46e5" : "none",
                                fontWeight: activeTab === "map" ? "600" : "400", color: activeTab === "map" ? "#4f46e5" : "#64748b",
                                cursor: "pointer", transition: "all 0.2s"
                            }}
                        >
                            <i className="fas fa-map-marked-alt" style={{marginRight:8}}></i> Rota Haritası
                        </button>
                        <button 
                            onClick={() => setActiveTab("details")}
                            style={{
                                flex: 1, padding: "15px", border: "none", background: activeTab === "details" ? "white" : "transparent",
                                borderBottom: activeTab === "details" ? "3px solid #4f46e5" : "none",
                                fontWeight: activeTab === "details" ? "600" : "400", color: activeTab === "details" ? "#4f46e5" : "#64748b",
                                cursor: "pointer", transition: "all 0.2s"
                            }}
                        >
                            <i className="fas fa-list-ul" style={{marginRight:8}}></i> Detaylar & Kalanlar 
                            {rejected.length > 0 && <span className="badge" style={{marginLeft:5, background:"#ef4444", color:"white", fontSize:"10px", padding:"2px 6px", borderRadius:"10px"}}>{rejected.length}</span>}
                        </button>
                    </div>

                    {/* SEKME 1: HARİTA */}
                    {activeTab === "map" && (
                        <div style={{ height: "600px", position: "relative" }}>
                            <MapContainer center={[40.765, 29.940]} zoom={10} style={{ height: "100%", width: "100%" }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {routes.map((route, idx) => {
                                    const color = COLORS[idx % COLORS.length];
                                    const stops = route.route || [];
                                    return (
                                        <React.Fragment key={idx}>
                                            {route.pathCoordinates && <Polyline positions={route.pathCoordinates} pathOptions={{ color, weight: 5, opacity: 0.8 }} />}
                                            {stops.map((stop, i) => (
                                                <Marker key={i} position={[stop.latitude, stop.longitude]}>
                                                    <Popup>
                                                        <strong style={{color}}>{stop.stationName}</strong><br/>
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
                    )}

                    {/* SEKME 2: DETAY TABLOLARI */}
                    {activeTab === "details" && (
                        <div style={{ padding: "20px", animation: "fadeIn 0.3s" }}>
                            
                            {/* TABLO 1: YÜKLENEN ROTALAR */}
                            <h4 style={{marginTop: 0, color: "#1e293b", borderBottom:"1px solid #eee", paddingBottom: "10px"}}>
                                <i className="fas fa-truck-loading" style={{color:"#4f46e5", marginRight:8}}></i> 
                                Araç Yükleme Planı
                            </h4>
                            <table className="modern-table" style={{marginBottom: "30px"}}>
                                <thead>
                                    <tr>
                                        <th>Araç ID</th>
                                        <th>Rota (Duraklar)</th>
                                        <th>Maliyet</th>
                                        <th>Mesafe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routes.map((r, i) => (
                                        <tr key={i}>
                                            <td style={{fontWeight:"bold", color: COLORS[i % COLORS.length]}}>#{r.vehicleId}</td>
                                            <td>
                                                {r.route.map((s, idx) => (
                                                    <span key={idx}>
                                                        {idx > 0 && " ➝ "}
                                                        <span style={{borderBottom: `1px dashed ${COLORS[i % COLORS.length]}`}}>{s.stationName}</span>
                                                    </span>
                                                ))}
                                            </td>
                                            <td>₺{r.totalCost.toFixed(2)}</td>
                                            <td>{r.totalDistanceKm.toFixed(1)} km</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* TABLO 2: TAŞINAMAYANLAR (Sadece varsa göster) */}
                            {rejected.length > 0 && (
                                <div style={{marginTop: "30px"}}>
                                    <h4 style={{color: "#ef4444", borderBottom:"1px solid #fee2e2", paddingBottom: "10px"}}>
                                        <i className="fas fa-exclamation-triangle" style={{marginRight:8}}></i> 
                                        Kapasite Dışı Kalan Kargolar (Şubede Bekliyor)
                                    </h4>
                                    <table className="modern-table" style={{border: "1px solid #fee2e2"}}>
                                        <thead style={{background: "#fef2f2"}}>
                                            <tr>
                                                <th style={{color:"#b91c1c"}}>İstasyon</th>
                                                <th style={{color:"#b91c1c"}}>Kargo Sayısı</th>
                                                <th style={{color:"#b91c1c"}}>Toplam Ağırlık</th>
                                                <th style={{color:"#b91c1c"}}>Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rejected.map((item, i) => (
                                                <tr key={i}>
                                                    <td style={{fontWeight:"bold"}}>{item.stationName}</td>
                                                    <td>{item.cargoCount} Adet</td>
                                                    <td>{item.weight} kg</td>
                                                    <td><span className="badge" style={{background:"#fee2e2", color:"#b91c1c"}}>Taşınmadı</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </>
        )}
      </main>
      
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}