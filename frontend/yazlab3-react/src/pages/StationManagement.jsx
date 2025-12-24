import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Label } from "../components/ui/label";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'; // useMapEvents eklendi
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import "../styles/theme.css";
import "../styles/table.css";

// Leaflet İkon Sorunu Çözümü
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function StationManagement({ onLogout }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Haritadan seçim modu açık mı?
  const [isSelecting, setIsSelecting] = useState(false);

  // Form Verileri
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: ""
  });

  // Sayfa açılınca istasyonları çek
  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await fetch("http://localhost:5014/api/stations");
      const data = await res.json();
      setStations(data);
    } catch (err) {
      console.error("İstasyonlar yüklenemedi:", err);
    }
  };

  // Yeni istasyon ekle
  const handleSave = async () => {
    if (!formData.name || !formData.latitude || !formData.longitude) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5014/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        }),
      });

      if (res.ok) {
        alert("İstasyon eklendi!");
        setFormData({ name: "", latitude: "", longitude: "" });
        fetchStations();
      } else {
        alert("Hata oluştu.");
      }
    } catch (err) {
      alert("Sunucu hatası: " + err);
    }
    setLoading(false);
  };

  // İstasyon sil
  const handleDelete = async (id) => {
    if (!window.confirm("Bu istasyonu silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`http://localhost:5014/api/stations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchStations();
      } else {
        alert("Silinemedi.");
      }
    } catch (err) {
      alert("Hata: " + err);
    }
  };

  // --- HARİTA TIKLAMA YÖNETİCİSİ ---
  // Bu bileşen harita içinde çalışır ve tıklamaları dinler
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        // Sadece seçim modu aktifse çalışır
        if (isSelecting) {
          setFormData((prev) => ({
            ...prev,
            latitude: e.latlng.lat.toFixed(6), // Hassasiyeti ayarladık
            longitude: e.latlng.lng.toFixed(6)
          }));
          // Seçim yapıldıktan sonra modu otomatik kapat (İsteğe bağlı, kullanıcı dostu olması için)
          setIsSelecting(false);
        }
      },
    });
    return null;
  };

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
            <h1>İstasyon Yönetimi</h1>
            <p className="subtitle">
              Sistemdeki lojistik noktalarını harita üzerinde yönetin.
            </p>
          </div>
        </header>

        {/* ÜST KISIM: HARİTA GÖRÜNÜMÜ */}
        <div 
            className="card map-section" 
            style={{ 
                height: "400px", 
                marginBottom: "24px", 
                overflow: "hidden",
                // Seçim modu açıksa imleci değiştir
                cursor: isSelecting ? "crosshair" : "grab" 
            }}
        >
             <MapContainer center={[40.765, 29.940]} zoom={10} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* Tıklama Olaylarını Dinleyen Bileşen */}
                <MapClickHandler />

                {/* Kayıtlı İstasyonları Göster */}
                {stations.map((s) => (
                  <Marker key={s.id} position={[s.latitude, s.longitude]}>
                    <Popup>
                      <strong>{s.name}</strong> <br />
                      Konum: {s.latitude}, {s.longitude}
                    </Popup>
                  </Marker>
                ))}

                {/* Geçici Seçim İşaretçisi (Kullanıcı haritadan seçtiğinde orada bir marker çıksın) */}
                {formData.latitude && formData.longitude && (
                    <Marker position={[formData.latitude, formData.longitude]} opacity={0.6}>
                        <Popup>Yeni Seçilen Konum</Popup>
                    </Marker>
                )}
             </MapContainer>
             
             {/* Seçim Modu Bilgilendirmesi (Harita üzerinde overlay) */}
             {isSelecting && (
                 <div style={{
                     position: "absolute", 
                     top: "10px", 
                     left: "50%", 
                     transform: "translateX(-50%)", 
                     background: "rgba(0,0,0,0.7)", 
                     color: "white", 
                     padding: "8px 16px", 
                     borderRadius: "20px",
                     zIndex: 1000,
                     pointerEvents: "none",
                     fontSize: "14px"
                 }}>
                     <i className="fa-solid fa-crosshairs"></i> Konum seçmek için haritaya tıklayın
                 </div>
             )}
        </div>

        {/* ALT KISIM: EKLEME FORMU VE LİSTE */}
        <div className="dashboard-grid admin-station-grid">
          
          {/* ➕ YENİ İSTASYON EKLEME FORMU */}
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <i className="fa-solid fa-plus-circle" style={{ marginRight: 10, color: "var(--primary)" }}></i>
                Yeni İstasyon Ekle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="form-group">
                <Label>İstasyon Adı</Label>
                <Input
                  type="text"
                  placeholder="Örn: Kartepe Şube"
                  className="modern-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* HARİTA SEÇİM BUTONU */}
              <div style={{ margin: "20px 0", textAlign: "center" }}>
                  <Button 
                    type="button"
                    onClick={() => setIsSelecting(!isSelecting)}
                    style={{
                        width: "100%",
                        background: isSelecting ? "#dc2626" : "#4f46e5", // Kırmızı (İptal) veya Mavi (Seç)
                        color: "white"
                    }}
                  >
                      {isSelecting ? (
                          <>
                            <i className="fa-solid fa-times" style={{marginRight: "8px"}}></i>
                            Seçimi İptal Et
                          </>
                      ) : (
                          <>
                            <i className="fa-solid fa-map-pin" style={{marginRight: "8px"}}></i>
                            Harita Üzerinden Seç
                          </>
                      )}
                  </Button>
              </div>

              <div className="form-group" style={{ marginTop: "16px" }}>
                <Label>Enlem (Latitude)</Label>
                <Input
                  type="number"
                  placeholder="Örn: 40.7654"
                  className="modern-input"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  // Kullanıcı isterse elle de girebilir, o yüzden readOnly yapmadık ama tercih edersen yapabilirsin
                />
              </div>

              <div className="form-group" style={{ marginTop: "16px" }}>
                <Label>Boylam (Longitude)</Label>
                <Input
                  type="number"
                  placeholder="Örn: 29.9402"
                  className="modern-input"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                />
              </div>

              <Button
                className="modern-submit-btn"
                style={{ marginTop: "24px", width: "100%" }}
                onClick={handleSave}
                disabled={loading}
              >
                <i className="fa-solid fa-save" style={{ marginRight: 8 }}></i>
                {loading ? "Kaydediliyor..." : "İstasyonu Kaydet"}
              </Button>
            </CardContent>
          </Card>

          {/* 📊 İSTASYON LİSTESİ TABLOSU */}
          <Card className="card table-section">
            <CardHeader>
              <CardTitle>
                <i className="fa-solid fa-list-check" style={{ marginRight: 10, color: "var(--primary)" }}></i>
                Mevcut İstasyonlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>İstasyon</th>
                    <th>Enlem</th>
                    <th>Boylam</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.length === 0 ? (
                    <tr><td colSpan="4" style={{textAlign:"center"}}>Kayıtlı istasyon yok.</td></tr>
                  ) : (
                    stations.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: "600" }}>{s.name}</td>
                        <td>{s.latitude}</td>
                        <td>{s.longitude}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-table delete" onClick={() => handleDelete(s.id)}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}