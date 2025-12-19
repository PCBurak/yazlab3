import React from "react";
import Sidebar from "../components/ui/Sidebar";
import MapView from "../components/ui/MapView";
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

export default function UserDashboard() {
  return (
    <div className="dashboard-container">
      <aside className="modern-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          <span>LOGI-TECH</span>
        </div>
        <nav className="sidebar-nav">
          <Sidebar role="user" />
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>Kullanıcı Paneli</h1>
            <p className="subtitle">
              Kargo gönderimlerinizi yönetin ve aracınızı canlı takip edin.
            </p>
          </div>
        </header>

        {/* Üst Kısım: Form veya Özet Kartları */}
        <div className="top-section" style={{ marginBottom: "24px" }}>
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <i
                  className="fa-solid fa-box-open"
                  style={{ marginRight: 10, color: "var(--primary)" }}
                ></i>
                Yeni Kargo Gönder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: "20px",
                  alignItems: "end",
                }}
              >
                <div className="form-group">
                  <Label>Gönderim İstasyonu</Label>
                  <select className="modern-select">
                    <option>İzmit</option>
                    <option>Gebze</option>
                    <option>Darıca</option>
                  </select>
                </div>

                <div className="form-group">
                  <Label>Kargo Ağırlığı (kg)</Label>
                  <Input
                    type="number"
                    placeholder="Örn: 12"
                    className="modern-input"
                  />
                </div>

                <Button
                  className="modern-submit-btn"
                  style={{ height: "42px", padding: "0 30px" }}
                >
                  <i
                    className="fa-solid fa-paper-plane"
                    style={{ marginRight: 8 }}
                  ></i>
                  Gönderimi Onayla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alt Kısım: Geniş Harita */}
        <div className="bottom-section">
          <Card className="card">
            <CardHeader
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <CardTitle>
                <i
                  className="fa-solid fa-map-location-dot"
                  style={{ marginRight: 10, color: "var(--primary)" }}
                ></i>
                Size Ait Araç Güzergahı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="map-wrapper-large">
                <MapView />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
