import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar";
import "../styles/theme.css";

export default function Settings({ onLogout }) {
  const [settings, setSettings] = useState({
    FuelCost: "1",
    RentalCost: "200",
    RentedCapacity: "500",
  });
  const [vehicles, setVehicles] = useState([]); // Araçlar buraya dolacak
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Yönetici");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Kullanıcıyı al
        const storedUser = localStorage.getItem("user");
        if (storedUser)
          setAdminName(JSON.parse(storedUser).username || "Admin");

        // 2. Ayarları çek
        const sRes = await fetch("http://localhost:5014/api/settings");
        const sData = await sRes.json();
        const sObj = {};
        sData.forEach((item) => {
          sObj[item.key] = item.value;
        });
        setSettings(sObj);

        // 3. ARAÇLARI ÇEK (Otomatik gelmesi için burası kritik)
        const vRes = await fetch("http://localhost:5014/api/settings/vehicles");
        const vData = await vRes.json();
        setVehicles(vData); // Veritabanındaki araçlar state'e yüklendi

        setLoading(false);
      } catch (error) {
        console.error("Yükleme hatası:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addVehicle = () => {
    setVehicles([...vehicles, { id: 0, capacityKg: 500, isRented: false }]);
  };

  const removeVehicle = (index) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    try {
      // Ayarları kaydet
      const settingsPayload = Object.keys(settings).map((key) => ({
        key,
        value: settings[key].toString(),
      }));
      await fetch("http://localhost:5014/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsPayload),
      });

      // Araçları kaydet
      await fetch("http://localhost:5014/api/settings/update-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicles),
      });

      alert("✅ Veritabanı başarıyla güncellendi!");
    } catch (e) {
      alert("Kaydetme hatası!");
    }
  };

  if (loading) return <div className="loading-screen">Yükleniyor...</div>;

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
            <h1>Sistem Ayarları</h1>
            <p className="subtitle">
              Operasyonel maliyetleri ve araç filosunu yönetin.
            </p>
          </div>
        </header>

        {/* --- ÜST BÖLÜM: MALİYET AYARLARI --- */}
        <div className="card settings-main-card">
          <h4 className="section-title">
            <i className="fas fa-sliders-h"></i> Maliyet Ayarları
          </h4>
          <div className="settings-grid-3">
            <div className="input-group">
              <label>Yol Maliyeti (KM)</label>
              <input
                type="number"
                value={settings.FuelCost}
                onChange={(e) =>
                  setSettings({ ...settings, FuelCost: e.target.value })
                }
              />
            </div>
            <div className="input-group">
              <label>Kiralama Maliyeti</label>
              <input
                type="number"
                value={settings.RentalCost}
                onChange={(e) =>
                  setSettings({ ...settings, RentalCost: e.target.value })
                }
              />
            </div>
            <div className="input-group">
              <label>Kiralık Araç Kapasitesi</label>
              <input
                type="number"
                value={settings.RentedCapacity}
                onChange={(e) =>
                  setSettings({ ...settings, RentedCapacity: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* --- ALT BÖLÜM: ARAÇ FİLOSU (DÜZELTİLMİŞ ARAYÜZ) --- */}
        <div className="card fleet-management-card">
          <div className="fleet-header">
            <h4 className="section-title">
              <i className="fas fa-truck-moving"></i> Sabit Araç Filosu
            </h4>
            <button className="add-btn" onClick={addVehicle}>
              <i className="fas fa-plus"></i> Yeni Araç
            </button>
          </div>

          <div className="fleet-grid">
            {vehicles.map((v, index) => (
              <div key={index} className="vehicle-mini-card">
                <button
                  className="delete-mini-btn"
                  onClick={() => removeVehicle(index)}
                >
                  ×
                </button>
                <div className="v-card-content">
                  <div className="v-icon">
                    <i className="fas fa-truck"></i>
                  </div>
                  <div className="v-info">
                    <label>Araç #{index + 1} Kapasite</label>
                    <div className="v-input-wrapper">
                      <input
                        type="number"
                        value={v.capacityKg}
                        onChange={(e) => {
                          const newV = [...vehicles];
                          newV[index].capacityKg =
                            parseInt(e.target.value) || 0;
                          setVehicles(newV);
                        }}
                      />
                      <span>KG</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="save-full-btn" onClick={handleSaveAll}>
            <i className="fas fa-save"></i> Tüm Değişiklikleri Veritabanına
            Kaydet
          </button>
        </div>
      </main>
    </div>
  );
}
