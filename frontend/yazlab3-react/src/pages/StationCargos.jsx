import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar"; // Doğrudan bileşen
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import "../styles/theme.css";
import "../styles/table.css";

export default function StationCargos({ onLogout }) {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Tüm İstasyonları Çek
  useEffect(() => {
    fetch("http://localhost:5014/api/stations")
      .then((res) => res.json())
      .then((data) => setStations(data))
      .catch((err) => console.error("İstasyon hatası:", err));
  }, []);

  // 2. İstasyon Seçilince Kargoları Çek
  const handleStationClick = (station) => {
    setSelectedStation(station);
    setLoading(true);
    
    // API İsteği: Seçilen istasyon ID'sine göre kargoları getir
    fetch(`http://localhost:5014/api/cargo/by-station/${station.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Veri çekilemedi");
        return res.json();
      })
      .then((data) => {
        setCargos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="dashboard-container">
      {/* DÜZELTME: <aside> etiketi kaldırıldı. 
         Sidebar zaten kendi stilini taşıyor.
      */}
      <Sidebar role="Admin" onLogout={onLogout} />

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>İstasyon Depo Durumu</h1>
            <p className="subtitle">İstasyonlardaki bekleyen yükleri inceleyin.</p>
          </div>
        </header>

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr" }}>
          
          {/* SOL: İSTASYON LİSTESİ */}
          <Card className="card" style={{ height: "calc(100vh - 140px)", overflowY: "auto" }}>
            <CardHeader>
              <CardTitle>İstasyonlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="station-list">
                {stations.length === 0 ? <p>Yükleniyor...</p> : stations.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleStationClick(s)}
                    style={{
                      padding: "15px",
                      cursor: "pointer",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      background: selectedStation?.id === s.id ? "#eef2ff" : "white",
                      border: selectedStation?.id === s.id ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                      fontWeight: selectedStation?.id === s.id ? "600" : "400",
                      color: selectedStation?.id === s.id ? "#4f46e5" : "#1e293b",
                      transition: "all 0.2s"
                    }}
                  >
                    <i className="fa-solid fa-warehouse" style={{ marginRight: "10px" }}></i>
                    {s.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SAĞ: KARGO TABLOSU */}
          <Card className="card" style={{ height: "calc(100vh - 140px)", overflowY: "auto" }}>
            <CardHeader>
              <CardTitle>
                {selectedStation ? `${selectedStation.name} - Yük Listesi` : "İstasyon Seçiniz"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedStation ? (
                <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "50px" }}>
                  <i className="fa-solid fa-arrow-left" style={{ fontSize: "24px", marginBottom: "10px" }}></i>
                  <p>Detayları görmek için soldan bir istasyon seçin.</p>
                </div>
              ) : loading ? (
                <p>Yükleniyor...</p>
              ) : cargos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                   <i className="fa-solid fa-box-open" style={{ fontSize: "32px", marginBottom: "15px", opacity: 0.5 }}></i>
                   <p>Bu istasyonda şu an bekleyen kargo yok.</p>
                </div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Alıcı</th>
                      <th>Tip</th>
                      <th>Ağırlık</th>
                      <th>Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargos.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: "bold" }}>#{c.id}</td>
                        <td>{c.receiverName || "-"}</td>
                        <td><span className="badge badge-type">{c.cargoType || "Standart"}</span></td>
                        <td>{c.totalWeightKg} kg</td>
                        <td style={{ fontSize: "13px", color: "#64748b" }}>{c.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}