import React, { useState } from "react";
import Sidebar from "../components/ui/Sidebar";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "../styles/theme.css";

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#06b6d4'];

export default function AdminScenarioPage({ onLogout }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Input States
  const [scenarioId, setScenarioId] = useState(1);
  const [mode, setMode] = useState("unlimited");
  const [strategy, setStrategy] = useState(0);

  // UI States
  const [activeTab, setActiveTab] = useState("map");
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);
  const [selectedCargo, setSelectedCargo] = useState(null);

  const toggleExpand = (id) => {
    if (expandedVehicleId === id) setExpandedVehicleId(null);
    else setExpandedVehicleId(id);
  };

  async function handleRunScenario() {
    setLoading(true);
  
    try {
      const response = await fetch("http://localhost:5014/api/admin/run-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: Number(scenarioId),
          unlimitedVehicles: mode === "unlimited",
          strategy: strategy,
        }),
      });
    
      const data = await response.json();
    
      console.log("RUN-SCENARIO RAW RESPONSE:", data);
      console.log("RAW rejectedCargos length:", data?.rejectedCargos?.length);
      console.log("RAW meta:", data?.meta);
    
      if (!response.ok) {
        alert(data.message || "Error running scenario");
      } else {
        const normalized = Array.isArray(data)
          ? { routes: data, rejectedCargos: [], meta: null }
          : {
              routes: data.routes ?? data.Routes ?? [],
              rejectedCargos: data.rejectedCargos ?? data.rejectedRequests ?? data.RejectedCargos ?? [],
              meta: data.meta ?? null,
            };
          
        console.log("RUN-SCENARIO NORMALIZED:", normalized);
        console.log("NORMAL rejectedCargos length:", normalized.rejectedCargos?.length);
        console.log("NORMAL meta:", normalized.meta);
          
        setResult(normalized);
        setActiveTab("map");
      }
    } catch (err) {
      alert("Server Error: " + err);
    }
  
    setLoading(false);
  }


  // Statistics
  const routes = Array.isArray(result) ? result : (result?.routes || []);
  const rejected = result?.rejectedCargos || [];
  const totalCost = routes.reduce((acc, r) => acc + r.totalCost, 0);
  const totalVehicles = routes.length;
  const totalRejectedWeight = rejected.reduce((acc, r) => acc + r.weight, 0);

  // Styles
  const getBigCardStyle = (isSelected) => ({
    flex: 1, padding: "20px", borderRadius: "12px",
    border: isSelected ? "2px solid #4f46e5" : "1px solid #e2e8f0",
    backgroundColor: isSelected ? "#eef2ff" : "white",
    cursor: "pointer", transition: "all 0.3s ease",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: "8px", position: "relative", minHeight: "110px"
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
            <h1>Senaryo Testi</h1>
            <p className="subtitle">Önceden tanımlanmış senaryoları çalıştır ve analiz et.</p>
          </div>
        </header>

        {/* --- CONTROL PANEL --- */}
        <div className="card" style={{ marginBottom: "20px", padding: "30px" }}>
            
            {/* 1. SCENARIO SELECTION */}
            <div style={{marginBottom: "25px"}}>
                <label style={{display:"block", marginBottom: 8, fontWeight: 600, color: "#334155"}}>Test Senaryosu Seçin:</label>
                <select 
                    value={scenarioId} 
                    onChange={(e) => setScenarioId(Number(e.target.value))}
                    className="modern-input"
                    style={{width: "100%", padding: "12px", fontSize: "15px", border: "1px solid #cbd5e1", borderRadius: "8px"}}
                >
                    <option value={1}>Senaryo 1: Standart Dağıtım (Başiskele Yoğun)</option>
                    <option value={2}>Senaryo 2: Yüksek Kapasite Testi</option>
                    <option value={3}>Senaryo 3: Parçalı Yük Testi</option>
                    <option value={4}>Senaryo 4: Uzak Mesafe Testi</option>
                </select>
            </div>

            <div style={{height: "1px", background: "#e2e8f0", margin: "20px 0"}}></div>

            {/* 2. MODE SELECTION (From RoutePlanning) */}
            <h3 style={{fontSize: "16px", color: "#64748b", marginBottom: "15px"}}>
                <i className="fas fa-sliders-h" style={{marginRight: 8}}></i> Araç Yapılandırması
            </h3>

            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                <div style={getBigCardStyle(mode === "unlimited")} onClick={() => setMode("unlimited")}>
                    <div style={{ fontSize: "28px", color: mode === "unlimited" ? "#4f46e5" : "#94a3b8" }}><i className="fas fa-infinity"></i></div>
                    <div style={{textAlign: "center"}}>
                        <strong style={{ display: "block", fontSize: "15px", color: "#1e293b" }}>Sınırsız Araç</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Otomatik Kiralama</span>
                    </div>
                    {mode === "unlimited" && <i className="fas fa-check-circle" style={{position:"absolute", top:10, right:10, color:"#4f46e5", fontSize:"18px"}}></i>}
                </div>

                <div style={getBigCardStyle(mode === "fixed")} onClick={() => setMode("fixed")}>
                    <div style={{ fontSize: "28px", color: mode === "fixed" ? "#4f46e5" : "#94a3b8" }}><i className="fas fa-truck-loading"></i></div>
                    <div style={{textAlign: "center"}}>
                        <strong style={{ display: "block", fontSize: "15px", color: "#1e293b" }}>Sabit Filo</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>3 Özmal Araç</span>
                    </div>
                    {mode === "fixed" && <i className="fas fa-check-circle" style={{position:"absolute", top:10, right:10, color:"#4f46e5", fontSize:"18px"}}></i>}
                    
                    {/* Strategy Expansion */}
                    {mode === "fixed" && (
                        <div style={{ marginTop: "15px", width: "100%", animation: "fadeIn 0.4s ease" }}>
                            <div style={{height: "1px", background: "#cbd5e1", marginBottom: "10px"}}></div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button className="modern-btn" onClick={(e) => { e.stopPropagation(); setStrategy(0); }} style={{flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: strategy === 0 ? "#4f46e5" : "white", color: strategy === 0 ? "white" : "#64748b", fontWeight: "600", fontSize: "11px"}}>Max Ağırlık</button>
                                <button className="modern-btn" onClick={(e) => { e.stopPropagation(); setStrategy(1); }} style={{flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: strategy === 1 ? "#4f46e5" : "white", color: strategy === 1 ? "white" : "#64748b", fontWeight: "600", fontSize: "11px"}}>Max Adet</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ textAlign: "right", marginTop: "25px" }}>
                <button className="modern-submit-btn" style={{ width: "200px", height: "50px", fontSize: "16px", borderRadius: "8px" }} onClick={handleRunScenario} disabled={loading}>
                    {loading ? <span><i className="fas fa-spinner fa-spin"></i> İşleniyor...</span> : <span><i className="fas fa-play" style={{ marginRight: 8 }}></i> Senaryoyu Çalıştır</span>}
                </button>
            </div>
        </div>

        {/* --- RESULT SECTION (Uses the Fixed Z-Index Layout) --- */}
        {result && (
          <div className="card" style={{ padding: 0, overflow: "hidden", height: "600px", display: "flex", flexDirection: "column", position: "relative", isolation: "isolate" }}>
            
            {/* TABS (Top Layer) */}
            <div style={{ flex: "0 0 auto", background: "white", zIndex: 20, position: "relative", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
                <button onClick={() => setActiveTab("map")} style={{ flex: 1, padding: "18px", border: "none", background: "transparent", borderBottom: activeTab === "map" ? "3px solid #4f46e5" : "3px solid transparent", color: activeTab === "map" ? "#4f46e5" : "#94a3b8", fontWeight: activeTab === "map" ? "700" : "500", fontSize: "15px", cursor: "pointer", transition: "all 0.2s" }}>
                  <i className="fas fa-map-marked-alt" style={{ marginRight: 8 }}></i> Harita Sonuçları
                </button>
                <button onClick={() => setActiveTab("details")} style={{ flex: 1, padding: "18px", border: "none", background: "transparent", borderBottom: activeTab === "details" ? "3px solid #4f46e5" : "3px solid transparent", color: activeTab === "details" ? "#4f46e5" : "#94a3b8", fontWeight: activeTab === "details" ? "700" : "500", fontSize: "15px", cursor: "pointer", transition: "all 0.2s" }}>
                  <i className="fas fa-boxes" style={{ marginRight: 8 }}></i> Yük Detayları
                </button>
              </div>

              {activeTab === "map" && (
                <div style={{ padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 15, alignItems: "center" }}>
                  <span className="badge" style={{ background: "#dbeafe", color: "#1e40af" }}>Araç: {totalVehicles}</span>
                  <span className="badge" style={{ background: "#ffedd5", color: "#9a3412" }}>Maliyet: ₺{totalCost.toFixed(0)}</span>
                  {totalRejectedWeight > 0 && <span className="badge" style={{ background: "#fee2e2", color: "#b91c1c" }}><i className="fas fa-exclamation-triangle"></i> Kalan: {totalRejectedWeight} kg</span>}
                </div>
              )}
            </div>

            {/* CONTENT (Bottom Layer) */}
            <div style={{ flex: "1 1 auto", position: "relative", zIndex: 1, overflowY: activeTab === "details" ? "auto" : "hidden" }}>
              
              {/* MAP */}
              {activeTab === "map" && (
                <MapContainer center={[40.765, 29.940]} zoom={10} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {routes.map((route, idx) => (
                    <React.Fragment key={idx}>
                      {route.pathCoordinates && <Polyline positions={route.pathCoordinates} pathOptions={{ color: COLORS[idx % COLORS.length], weight: 5 }} />}
                      {route.route.map((stop, i) => (
                        <Marker key={i} position={[stop.latitude, stop.longitude]}>
                          <Popup><strong>{stop.stationName}</strong><br />Araç: #{route.vehicleId}</Popup>
                        </Marker>
                      ))}
                    </React.Fragment>
                  ))}
                </MapContainer>
              )}

              {/* DETAILS */}
              {activeTab === "details" && (
                <div style={{ padding: "20px", background: "#f8fafc" }}>
                  <div style={{ marginBottom: 20, display: "flex", gap: 15 }}>
                    <div className="badge" style={{ background: "#dbeafe", color: "#1e40af", padding: "12px 20px", borderRadius: 8, fontSize: "14px" }}>Toplam Araç: <strong>{totalVehicles}</strong></div>
                    <div className="badge" style={{ background: "#ffedd5", color: "#9a3412", padding: "12px 20px", borderRadius: 8, fontSize: "14px" }}>Toplam Maliyet: <strong>₺{totalCost.toFixed(2)}</strong></div>
                    {totalRejectedWeight > 0 && <div className="badge" style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 20px", borderRadius: 8, border: "1px solid #fca5a5", fontSize: "14px" }}><i className="fas fa-exclamation-triangle" style={{ marginRight: 5 }}></i>Taşınamayan Yük: <strong>{totalRejectedWeight} Kg</strong></div>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {routes.map((vehicle, idx) => {
                      const isExpanded = expandedVehicleId === vehicle.vehicleId;
                      const color = COLORS[idx % COLORS.length];
                      const totalLoadCount = vehicle.route.reduce((acc, stop) => acc + (stop.loadedCargos?.reduce((s, c) => s + c.count, 0) || 0), 0);
                      const totalLoadWeight = vehicle.route.reduce((acc, stop) => acc + (stop.loadedCargos?.reduce((s, c) => s + c.weight, 0) || 0), 0);

                      return (
                        <div key={idx} className="card" style={{ padding: 0, overflow: "hidden", borderLeft: `5px solid ${color}` }}>
                          <div onClick={() => toggleExpand(vehicle.vehicleId)} style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "white" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                              <div style={{ background: color, color: "white", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{idx + 1}</div>
                              <div><h4 style={{ margin: 0, color: "#1e293b" }}>Araç #{vehicle.vehicleId}</h4><span style={{ fontSize: "13px", color: "#64748b" }}>{vehicle.totalDistanceKm.toFixed(1)} km • ₺{vehicle.totalCost.toFixed(2)}</span></div>
                            </div>
                            <div style={{ textAlign: "right", marginRight: 20 }}><div style={{ fontSize: "12px", color: "#64748b" }}>TOPLAM YÜK</div><div style={{ fontWeight: "bold", color: "#334155" }}>{totalLoadCount} Adet / {totalLoadWeight} Kg</div></div>
                            <div style={{ color: "#94a3b8" }}><i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i></div>
                          </div>
                          {isExpanded && (
                            <div style={{ borderTop: "1px solid #e2e8f0", background: "#fcfcfc", padding: "20px", animation: "slideDown 0.3s" }}>
                              <h5 style={{ marginTop: 0, color: "#475569", marginBottom: 15 }}>Durak ve Yük Dağılımı</h5>
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {vehicle.route.map((stop, sIdx) => (
                                  <div key={sIdx} style={{ display: "flex", gap: 15, borderBottom: "1px dashed #e2e8f0", paddingBottom: 10 }}>
                                    <div style={{ minWidth: "120px" }}><div style={{ fontSize: "11px", color: "#94a3b8" }}>DURAK {stop.order}</div><strong style={{ color: color }}>{stop.stationName}</strong></div>
                                    <div style={{ flex: 1 }}>
                                      {stop.loadedCargos && stop.loadedCargos.length > 0 ? (
                                        <table className="modern-table" style={{ fontSize: "12px", background: "white" }}>
                                          <thead><tr><th>Kargo ID</th><th>Adet</th><th>Ağırlık</th><th>Detay</th></tr></thead>
                                          <tbody>
                                            {stop.loadedCargos.map((cargo, cIdx) => (
                                              <tr key={cIdx} className="cargo-row" onClick={() => setSelectedCargo({ ...cargo, stationName: stop.stationName, vehicleId: vehicle.vehicleId })}>
                                                <td>#{cargo.cargoId}</td><td>{cargo.count}</td><td>{cargo.weight} kg</td><td><i className="fas fa-info-circle" style={{ color: "#3b82f6", cursor: "pointer" }}></i></td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>Bu duraktan yük alınmadı.</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {rejected.length > 0 && (
                    <div className="card" style={{ marginTop: 30, borderLeft: "5px solid #ef4444", padding: 20 }}>
                      <h4 style={{ color: "#ef4444", marginTop: 0 }}><i className="fas fa-exclamation-circle"></i> Kapasite Dışı Kalanlar (Şubede Bekliyor)</h4>
                      <table className="modern-table"><thead><tr><th>İstasyon</th><th>Kargo Sayısı</th><th>Ağırlık</th><th>Durum</th></tr></thead><tbody>{rejected.map((item, i) => (<tr key={i}><td>{item.stationName}</td><td>{item.cargoCount}</td><td>{item.weight} kg</td><td><span className="badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>Beklemede</span></td></tr>))}</tbody></table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODAL --- */}
        {selectedCargo && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
            <div className="card" style={{ width: "400px", padding: "30px", position: "relative", animation: "slideDown 0.3s" }}>
              <button onClick={() => setSelectedCargo(null)} style={{ position: "absolute", top: 10, right: 15, border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
              <h3 style={{ marginTop: 0, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: 15 }}>Kargo #{selectedCargo.cargoId} Detayı</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 15, marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Alım İstasyonu:</span><strong>{selectedCargo.stationName}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Atanan Araç:</span><span className="badge" style={{ background: "#eef2ff", color: "#4f46e5" }}>Araç #{selectedCargo.vehicleId}</span></div>
                <div style={{ borderTop: "1px dashed #e2e8f0", margin: "10px 0" }}></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px" }}><span style={{ color: "#64748b" }}>Paket Sayısı:</span><strong>{selectedCargo.count} Adet</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px" }}><span style={{ color: "#64748b" }}>Ağırlık:</span><strong style={{ color: "#0f172a" }}>{selectedCargo.weight} Kg</strong></div>
              </div>
              <button onClick={() => setSelectedCargo(null)} className="modern-btn" style={{ width: "100%", marginTop: 25, background: "#f1f5f9", color: "#334155" }}>Kapat</button>
            </div>
          </div>
        )}

      </main>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .cargo-row:hover { background-color: #f8fafc; cursor: pointer; }
      `}</style>
    </div>
  );
}