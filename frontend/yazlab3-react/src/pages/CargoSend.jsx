import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Label } from "../components/ui/label";
import "../styles/theme.css";

export default function CargoSend({ user, onLogout }) {
  // --- STATE ---
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form Verileri
  const [formData, setFormData] = useState({
    stationId: "",
    weight: "",
    cargoType: "Standart Koli",
    receiverName: ""
  });

  // 1. İstasyonları Veritabanından Çek
  useEffect(() => {
    fetch("http://localhost:5014/api/cargo/stations")
      .then((res) => res.json())
      .then((data) => {
        setStations(data);
        // İlk istasyonu varsayılan seç
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, stationId: data[0].id }));
        }
      })
      .catch((err) => console.error("İstasyonlar yüklenemedi:", err));
  }, []);

  // Input değişimi
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form Gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const currentUser = JSON.parse(localStorage.getItem("user"));
    
    // Backend'e gidecek tam paket
    const payload = {
        userId: currentUser ? currentUser.id : 0,
        stationId: Number(formData.stationId),
        weight: Number(formData.weight),
        cargoType: formData.cargoType,
        receiverName: formData.receiverName
    };

    try {
        const response = await fetch("http://localhost:5014/api/cargo/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Kargo talebiniz başarıyla alındı! Tarih ve detaylar kaydedildi.");
            // Formu temizle
            setFormData({ ...formData, weight: "", receiverName: "" });
        } else {
            const errData = await response.json();
            alert("Hata: " + (errData.message || "İşlem başarısız."));
        }
    } catch (error) {
        alert("Sunucu hatası: " + error);
    }
    setLoading(false);
  };

  // Tahmini Maliyet (Görsel Hesaplama)
  const estimatedCost = formData.weight ? (formData.weight * 5.5).toFixed(2) : "0.00";

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
            <h1>Kargo Gönder</h1>
            <p className="subtitle">Yeni bir gönderi oluşturun.</p>
          </div>
        </header>

        <section className="form-container-full">
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <i className="fa-solid fa-truck-ramp-box" style={{ marginRight: 10, color: "var(--primary)" }}></i>
                Gönderi Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="cargo-form" onSubmit={handleSubmit}>
                <div className="form-grid-three">
                  
                  {/* ÇIKIŞ İSTASYONU (DB) */}
                  <div className="form-group">
                    <Label>Çıkış İstasyonu</Label>
                    <select 
                        className="modern-select"
                        name="stationId"
                        value={formData.stationId}
                        onChange={handleChange}
                    >
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* VARIŞ İSTASYONU (SABİT) */}
                  <div className="form-group">
                    <Label>Varış İstasyonu</Label>
                    <select className="modern-select" disabled style={{background: "#f1f5f9"}}>
                      <option>Kocaeli Üniversitesi (Ana Merkez)</option>
                    </select>
                  </div>

                  {/* AĞIRLIK */}
                  <div className="form-group">
                    <Label>Kargo Ağırlığı (kg)</Label>
                    <Input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="Örn: 25"
                      className="modern-input"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-grid-two" style={{ marginTop: "20px" }}>
                  {/* KARGO TİPİ */}
                  <div className="form-group">
                    <Label>Kargo Tipi</Label>
                    <select className="modern-select" name="cargoType" value={formData.cargoType} onChange={handleChange}>
                      <option>Standart Koli</option>
                      <option>Hassas İçerik</option>
                      <option>Tehlikeli Madde</option>
                    </select>
                  </div>

                  {/* ALICI ADI */}
                  <div className="form-group">
                    <Label>Alıcı Ad Soyad</Label>
                    <Input 
                      type="text" 
                      name="receiverName" 
                      value={formData.receiverName} 
                      onChange={handleChange} 
                      className="modern-input"
                      placeholder="Örn: Ahmet Yılmaz"
                      required
                    />
                  </div>
                </div>

                <div className="form-footer" style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
                    <div className="price-estimation">
                        <span className="price-label">Tahmini Maliyet:</span>
                        <span className="price-value">₺ {estimatedCost}</span>
                    </div>
                  <Button type="submit" className="modern-submit-btn" disabled={loading}>
                    {loading ? "Kaydediliyor..." : "Gönderimi Tamamla"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}