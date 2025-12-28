import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar";
import "../styles/theme.css";

export default function Settings({ onLogout }) {
  const [settings, setSettings] = useState({
    FuelCost: "1",
    RentalCost: "200",
    RentedCapacity: "500",
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminName, setAdminName] = useState("Yönetici");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser)
          setAdminName(JSON.parse(storedUser).username || "Admin");

        const sRes = await fetch("http://localhost:5014/api/settings");
        if (!sRes.ok) {
          const err = await sRes.text();
          throw new Error("Ayarlar yüklenemedi: " + err);
        }
        const sData = await sRes.json();
        const sObj = {};
        sData.forEach((item) => {
          sObj[item.key] = item.value;
        });

        setSettings((prev) => ({
          ...prev,
          ...sObj,
        }));

        const vRes = await fetch("http://localhost:5014/api/settings/vehicles");
        if (!vRes.ok) {
          const err = await vRes.text();
          throw new Error("Araçlar yüklenemedi: " + err);
        }
        const vData = await vRes.json();
        setVehicles(vData);

        setLoading(false);
      } catch (error) {
        console.error("Yükleme hatası:", error);
        alert(error?.message || "Yükleme hatası!");
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
    if (saving) return;
    setSaving(true);

    try {
      const settingsPayload = Object.keys(settings).map((key) => ({
        key,
        value: settings[key]?.toString() ?? "",
      }));

      const sSaveRes = await fetch("http://localhost:5014/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsPayload),
      });

      if (!sSaveRes.ok) {
        const err = await sSaveRes.text();
        throw new Error("Ayarlar kaydedilemedi: " + err);
      }

      const vSaveRes = await fetch(
        "http://localhost:5014/api/settings/update-vehicles",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vehicles),
        }
      );

      if (!vSaveRes.ok) {
        const err = await vSaveRes.text();
        throw new Error("Araçlar kaydedilemedi: " + err);
      }

      alert("✅ Veritabanı başarıyla güncellendi!");
    } catch (e) {
      console.error("Kaydetme hatası:", e);
      alert(e?.message || "Kaydetme hatası!");
    } finally {
      setSaving(false);
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
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {adminName}
          </div>
        </header>

        <div className="card settings-main-card">
          <h4 className="section-title">
            <i className="fas fa-sliders-h"></i> Maliyet Ayarları
          </h4>
          <div className="settings-grid-3">
            <div className="input-group">
              <label>Yol Maliyeti (KM)</label>
              <input
                type="number"
                value={settings.FuelCost ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, FuelCost: e.target.value })
                }
              />
            </div>
            <div className="input-group">
              <label>Kiralama Maliyeti</label>
              <input
                type="number"
                value={settings.RentalCost ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, RentalCost: e.target.value })
                }
              />
            </div>
            <div className="input-group">
              <label>Kiralık Araç Kapasitesi</label>
              <input
                type="number"
                value={settings.RentedCapacity ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, RentedCapacity: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="card fleet-management-card">
          <div className="fleet-header">
            <h4 className="section-title">
              <i className="fas fa-truck-moving"></i> Sabit Araç Filosu
            </h4>
            <button className="add-btn" onClick={addVehicle} disabled={saving}>
              <i className="fas fa-plus"></i> Yeni Araç
            </button>
          </div>

          <div className="fleet-grid">
            {vehicles.map((v, index) => (
              <div key={index} className="vehicle-mini-card">
                <button
                  className="delete-mini-btn"
                  onClick={() => removeVehicle(index)}
                  disabled={saving}
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
                          newV[index].capacityKg = parseInt(e.target.value) || 0;
                          setVehicles(newV);
                        }}
                        disabled={saving}
                      />
                      <span>KG</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="save-full-btn" onClick={handleSaveAll} disabled={saving}>
            <i className="fas fa-save"></i>{" "}
            {saving ? "Kaydediliyor..." : "Tüm Değişiklikleri Veritabanına Kaydet"}
          </button>
        </div>
      </main>
    </div>
  );
}
