import React, { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar";
import { Card } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

export default function UserDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, active: 0, totalWeight: 0 });

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5014/api/cargo/my-requests/${user.id}`)
        .then(res => res.json())
        .then(data => {
            const activeCount = data.filter(d => d.status.includes("Yolda")).length;
            const totalWeight = data.reduce((acc, curr) => acc + curr.weight, 0);
            setStats({
                total: data.length,
                active: activeCount,
                totalWeight: totalWeight
            });
        })
        .catch(err => console.error(err));
    }
  }, [user]);

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
            <h1>Hoş Geldiniz, {user?.username} 👋</h1>
            <p className="subtitle">Kargo operasyonlarınızın genel durumu.</p>
          </div>
        </header>
        <div className="stats-grid">
            <Card className="stat-card">
                <div className="p-4">
                    <div className="stat-icon purple"><i className="fa-solid fa-box-open"></i></div>
                    <div className="stat-info">
                        <p>Toplam Gönderi</p>
                        <h3>{stats.total} Adet</h3>
                    </div>
                </div>
            </Card>

            <Card className="stat-card">
                <div className="p-4">
                    <div className="stat-icon green"><i className="fa-solid fa-truck-fast"></i></div>
                    <div className="stat-info">
                        <p>Yoldaki Kargolar</p>
                        <h3>{stats.active} Adet</h3>
                    </div>
                </div>
            </Card>

            <Card className="stat-card">
                <div className="p-4">
                    <div className="stat-icon orange"><i className="fa-solid fa-weight-scale"></i></div>
                    <div className="stat-info">
                        <p>Toplam Hacim</p>
                        <h3>{stats.totalWeight} kg</h3>
                    </div>
                </div>
            </Card>
        </div>

        <div style={{ marginTop: "30px" }}>
            <h3>Hızlı İşlemler</h3>
            <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: "15px" }}>
                <div 
                    className="card action-card" 
                    onClick={() => navigate("/user/send")}
                    style={{ padding: "30px", cursor: "pointer", display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s" }}
                >
                    <div style={{ fontSize: "30px", color: "#4f46e5" }}><i className="fa-solid fa-plus-circle"></i></div>
                    <div>
                        <h4 style={{ margin: 0 }}>Yeni Kargo Gönder</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Hemen talep oluşturun.</p>
                    </div>
                </div>

                <div 
                    className="card action-card" 
                    onClick={() => navigate("/user/tracking")}
                    style={{ padding: "30px", cursor: "pointer", display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s" }}
                >
                    <div style={{ fontSize: "30px", color: "#10b981" }}><i className="fa-solid fa-map-location-dot"></i></div>
                    <div>
                        <h4 style={{ margin: 0 }}>Kargo Takibi</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Gönderilerinizi haritada izleyin.</p>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}