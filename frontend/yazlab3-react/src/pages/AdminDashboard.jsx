import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar";
import { useNavigate } from "react-router-dom"; 
import "../styles/theme.css";

export default function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStations: 0,
    totalVehicles: 0,
    totalRoutes: 0,
    pendingCargos: 0
  });

  // Kullanıcı adını State'te tutalım
  const [adminName, setAdminName] = useState("Yönetici");

  useEffect(() => {
    // 1. LocalStorage'dan kullanıcı adını çek
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      // Eğer kullanıcının adı varsa onu kullan, yoksa "Admin" yaz
      setAdminName(userObj.name || userObj.username || "Admin");
    }

    // 2. İstatistik Verileri (Mock Data)
    setStats({
        totalStations: 12, 
        totalVehicles: 5,
        totalRoutes: 24,
        pendingCargos: 150
    });
  }, []);

  // --- KART BİLEŞENİ ---
  const NavCard = ({ title, desc, icon, color, link }) => (
    <div 
        className="card nav-card" 
        onClick={() => navigate(link)}
        style={{
            cursor: "pointer", 
            transition: "all 0.3s ease",
            borderLeft: `5px solid ${color}`,
            display: "flex",
            alignItems: "center",
            padding: "25px",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "white"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
        <div style={{
            background: `${color}20`,
            color: color,
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            marginRight: "20px",
            flexShrink: 0
        }}>
            <i className={`fas ${icon}`}></i>
        </div>

        <div>
            <h3 style={{margin: "0 0 5px 0", color: "#1e293b", fontSize: "18px"}}>{title}</h3>
            <p style={{margin: 0, color: "#64748b", fontSize: "13px"}}>{desc}</p>
        </div>

        <div style={{position: "absolute", right: "20px", color: "#cbd5e1"}}>
            <i className="fas fa-chevron-right"></i>
        </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <aside className="modern-sidebar">
        <div className="sidebar-logo"><div className="logo-icon">L</div><span>LOGI-TECH</span></div>
        <Sidebar role="Admin" onLogout={onLogout} />
      </aside>

      <main className="main-content">
        
        {/* --- HEADER (GÜNCELLENDİ) --- */}
        <header className="content-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Admin Paneli</h1>
            <p className="subtitle">Sistem yönetimi ve lojistik operasyon merkezi.</p>
          </div>
          
          {/* SÜSLÜ PROFİL ALANI */}
          <div className="user-profile-card" style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "15px", 
              background: "white", 
              padding: "8px 15px", 
              borderRadius: "50px", 
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0"
          }}>
            <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{adminName}</span>
                <span style={{ display: "block", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sistem Yöneticisi</span>
            </div>
            <div style={{ 
                width: "40px", 
                height: "40px", 
                background: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)", 
                color: "white", 
                borderRadius: "50%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "18px", 
                fontWeight: "bold",
                boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)"
            }}>
                {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* --- İSTATİSTİKLER --- */}
        <section className="stats-grid" style={{marginBottom: "30px"}}>
            <div className="card stat-card"><div className="p-4"><div className="stat-icon purple"><i className="fas fa-map-marker-alt"></i></div><div className="stat-info"><p>Toplam İstasyon</p><h3>{stats.totalStations}</h3></div></div></div>
            <div className="card stat-card"><div className="p-4"><div className="stat-icon orange"><i className="fas fa-truck"></i></div><div className="stat-info"><p>Aktif Araçlar</p><h3>{stats.totalVehicles}</h3></div></div></div>
            <div className="card stat-card"><div className="p-4"><div className="stat-icon green"><i className="fas fa-route"></i></div><div className="stat-info"><p>Tamamlanan Rota</p><h3>{stats.totalRoutes}</h3></div></div></div>
            <div className="card stat-card"><div className="p-4"><div className="stat-icon blue"><i className="fas fa-boxes"></i></div><div className="stat-info"><p>Bekleyen Yük</p><h3>{stats.pendingCargos}</h3></div></div></div>
        </section>

        {/* --- HIZLI ERİŞİM MENÜSÜ --- */}
        <h3 style={{color: "#334155", marginBottom: "20px", paddingLeft: "5px", borderLeft: "4px solid #4f46e5", lineHeight: "1"}}>
            Hızlı Erişim & Operasyonlar
        </h3>

        <div style={{
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: "20px"
        }}>
            <NavCard 
                title="Akıllı Rota Planlama" 
                desc="Algoritma destekli rota oluşturma ve harita simülasyonu." 
                icon="fa-map-location-dot" 
                color="#4f46e5" 
                link="/admin/routes" 
            />

            <NavCard 
                title="Senaryo Test Merkezi" 
                desc="Hazır senaryoları çalıştır, yükle ve sistem kapasitesini test et." 
                icon="fa-vial" 
                color="#ea580c" 
                link="/admin/scenarios" 
            />

            <NavCard 
                title="İstasyon Yükleri" 
                desc="Hangi istasyonda ne kadar yük biriktiğini analiz et." 
                icon="fa-chart-pie" 
                color="#0891b2" 
                link="/admin/station-cargos" 
            />

            <NavCard 
                title="İstasyon Yönetimi" 
                desc="İstasyon ekle, çıkar, mesafe matrislerini güncelle." 
                icon="fa-building" 
                color="#059669" 
                link="/admin/stations" 
            />
        </div>

      </main>
    </div>
  );
}