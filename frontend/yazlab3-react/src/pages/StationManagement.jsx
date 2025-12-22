import React, { useState } from "react";
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
import "../styles/table.css";

export default function StationManagement() {
  // Örnek başlangıç verisi
  const [stations, setStations] = useState([
    {
      id: 1,
      name: "İzmit Ana Merkez",
      city: "Kocaeli",
      type: "Depo",
      status: "Aktif",
    },
    {
      id: 2,
      name: "Gebze Organize",
      city: "Kocaeli",
      type: "Dağıtım",
      status: "Aktif",
    },
    {
      id: 3,
      name: "Darıca Liman",
      city: "Kocaeli",
      type: "Aktarma",
      status: "Pasif",
    },
  ]);

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
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
        {/* HEADER */}
        <header className="content-header">
          <div>
            <h1>İstasyon Yönetimi</h1>
            <p className="subtitle">
              Sistemdeki tüm lojistik noktalarını yönetin ve izleyin.
            </p>
          </div>
          <div className="user-profile">
            <div className="user-info">
              <span className="user-role">Sistem Yöneticisi</span>
            </div>
            <div className="avatar">AD</div>
          </div>
        </header>

        <div className="dashboard-grid admin-station-grid">
          {/* ➕ YENİ İSTASYON EKLEME FORMU */}
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <i
                  className="fa-solid fa-plus-circle"
                  style={{ marginRight: 10, color: "var(--primary)" }}
                ></i>
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
                />
              </div>

              <div className="form-group" style={{ marginTop: "16px" }}>
                <Label>Şehir</Label>
                <Input
                  type="text"
                  placeholder="Örn: Kocaeli"
                  className="modern-input"
                />
              </div>

              <div className="form-group" style={{ marginTop: "16px" }}>
                <Label>İstasyon Tipi</Label>
                <select className="modern-select">
                  <option>Dağıtım Merkezi</option>
                  <option>Aktarma Noktası</option>
                  <option>Ana Depo</option>
                </select>
              </div>

              <Button
                className="modern-submit-btn"
                style={{ marginTop: "24px", width: "100%" }}
              >
                <i className="fa-solid fa-save" style={{ marginRight: 8 }}></i>
                İstasyonu Kaydet
              </Button>
            </CardContent>
          </Card>

          {/* 📊 İSTASYON LİSTESİ TABLOSU */}
          <Card className="card table-section">
            <CardHeader>
              <CardTitle>
                <i
                  className="fa-solid fa-list-check"
                  style={{ marginRight: 10, color: "var(--primary)" }}
                ></i>
                Mevcut İstasyonlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>İstasyon</th>
                    <th>Şehir</th>
                    <th>Tip</th>
                    <th>Durum</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: "600" }}>{s.name}</td>
                      <td>{s.city}</td>
                      <td>
                        <span className="badge badge-type">{s.type}</span>
                      </td>
                      <td>
                        <span
                          className={`status-dot ${
                            s.status === "Aktif" ? "online" : "offline"
                          }`}
                        ></span>
                        {s.status}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-table edit">
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button className="btn-table delete">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
