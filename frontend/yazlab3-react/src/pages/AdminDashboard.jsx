import React from "react";
import Sidebar from "../components/ui/Sidebar";
import MapView from "../components/ui/MapView";
import RouteTable from "../components/ui/RouteTable";
import { vehicles } from "../data/dummyVehicles";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

// Yeni stil dosyasını aşağıda veriyorum, bu yapıya uygun CSS'i theme.css'e eklemelisin.
import "../styles/theme.css";

export default function AdminDashboard() {
  const totalVehicles = vehicles.length;
  const totalCost = vehicles
    .reduce((sum, v) => sum + v.totalCost, 0)
    .toLocaleString();
  const totalRoutes = vehicles.reduce((sum, v) => sum + v.route.length, 0);

  return (
    <div className="dashboard-container">
      {/* 1. YENİLENMİŞ SİDEBAR */}
      <aside className="modern-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          <span>LOGI-TECH</span>
        </div>
        <nav className="sidebar-nav">
          <Sidebar role="admin" />
        </nav>
      </aside>

      <main className="main-content">
        {/* ÜST BAR / HEADER */}
        <header className="content-header">
          <div>
            <h1>Genel Bakış</h1>
            <p className="subtitle">
              Sistemdeki güncel lojistik verileri ve araç durumları.
            </p>
          </div>
        </header>

        {/* 2. ÖZET KARTLAR (GRID YAZILIMI) */}
        <section className="stats-grid">
          <Card className="stat-card">
            <CardContent>
              <div className="stat-icon purple">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
              <div className="stat-info">
                <p>Toplam Araç</p>
                <h3>{totalVehicles}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent>
              <div className="stat-icon green">
                <i className="fa-solid fa-route"></i>
              </div>
              <div className="stat-info">
                <p>Aktif Rota</p>
                <h3>{totalRoutes}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent>
              <div className="stat-icon orange">
                <i className="fa-solid fa-turkish-lira-sign"></i>
              </div>
              <div className="stat-info">
                <p>Toplam Maliyet</p>
                <h3>₺ {totalCost}</h3>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. ANA PANEL (HARİTA VE TABLO YAN YANA VEYA ALT ALTA) */}
        <div className="dashboard-grid">
          <Card className="map-section">
            <CardHeader>
              <CardTitle>Canlı Takip Haritası</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="map-wrapper">
                <MapView />
              </div>
            </CardContent>
          </Card>

          <Card className="table-section">
            <CardHeader>
              <CardTitle>Son Rota Detayları</CardTitle>
            </CardHeader>
            <CardContent>
              <RouteTable vehicles={vehicles} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
