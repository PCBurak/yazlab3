import React from "react";
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

export default function CargoSend() {
  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
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
        {/* HEADER */}
        <header className="content-header">
          <div>
            <h1>Kargo Gönder</h1>
            <p className="subtitle">
              Yeni bir gönderi oluşturun ve rota hesaplamasını başlatın.
            </p>
          </div>
        </header>

        {/* GÖNDERİM FORMU - ÜST BÖLGE */}
        <section className="form-container-full">
          <Card className="card">
            <CardHeader>
              <CardTitle>
                <i
                  className="fa-solid fa-truck-ramp-box"
                  style={{ marginRight: 10, color: "var(--primary)" }}
                ></i>
                Gönderi Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="cargo-form">
                <div className="form-grid-three">
                  <div className="form-group">
                    <Label>Çıkış İstasyonu</Label>
                    <select className="modern-select">
                      <option>İzmit Ana Merkez</option>
                      <option>Gebze Organize</option>
                      <option>Darıca Liman</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <Label>Varış İstasyonu</Label>
                    <select className="modern-select">
                      <option>Körfez Şube</option>
                      <option>Gölcük Şube</option>
                      <option>Kartepe Dağıtım</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <Label>Kargo Ağırlığı (kg)</Label>
                    <Input
                      type="number"
                      placeholder="Örn: 25"
                      className="modern-input"
                    />
                  </div>
                </div>

                <div className="form-grid-two" style={{ marginTop: "20px" }}>
                  <div className="form-group">
                    <Label>Kargo Tipi</Label>
                    <select className="modern-select">
                      <option>Standart Koli</option>
                      <option>Hassas İçerik</option>
                      <option>Tehlikeli Madde</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <Label>Alıcı Ad Soyad</Label>
                    <Input
                      type="text"
                      placeholder="Örn: Ahmet Yılmaz"
                      className="modern-input"
                    />
                  </div>
                </div>

                <div
                  className="form-footer"
                  style={{
                    marginTop: "30px",
                    borderTop: "1px solid #eee",
                    paddingTop: "20px",
                  }}
                >
                  <div className="price-estimation">
                    <span className="price-label">Tahmini Maliyet:</span>
                    <span className="price-value">₺ 145,50</span>
                  </div>
                  <Button
                    className="modern-submit-btn"
                    style={{ padding: "0 40px" }}
                  >
                    <i
                      className="fa-solid fa-paper-plane"
                      style={{ marginRight: 8 }}
                    ></i>
                    Gönderimi Tamamla
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* BİLGİLENDİRME ALANI - ALT BÖLGE (Geniş) */}
        <section className="info-section" style={{ marginTop: "24px" }}>
          <Card className="card info-card-bg">
            <CardContent>
              <div className="info-flex">
                <div className="info-icon">
                  <i className="fa-solid fa-circle-info"></i>
                </div>
                <div className="info-text">
                  <h4>Nasıl Çalışır?</h4>
                  <p>
                    Gönderiniz onaylandıktan sonra sistemimiz en uygun aracı ve
                    rotayı sizin için otomatik olarak atayacaktır. Canlı takibi
                    "Güzergahım" sayfasından yapabilirsiniz.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
