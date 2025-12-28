import React from "react";
import { NavLink } from "react-router-dom";
import "../../styles/sidebar.css";

export default function Sidebar({ role, onLogout }) {
  const isAdmin = role === "Admin" || role === "admin";
  const isUser = role === "User" || role === "user";

  return (
    <nav
      className="sidebar-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "100vh",
      }}
    >

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {isAdmin && (
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-chart-pie"></i>
                <span>Genel Bakış</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/admin/routes"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-route"></i>
                <span>Rota Planlama</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/admin/scenarios"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-vial"></i>
                <span>Senaryo Testi</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/admin/station-cargos"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-dolly"></i>
                <span>İstasyon Yükleri</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/admin/stations"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-location-dot"></i>
                <span>İstasyon Yönetimi</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-gear"></i>
                <span>Sistem Ayarları</span>
              </NavLink>
            </li>
          </ul>
        )}
        {isUser && (
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink
                to="/user"
                end
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-house"></i>
                <span>Panel</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/user/send"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-box-open"></i>
                <span>Kargo Gönder</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/user/tracking"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Kargo Takip</span>
              </NavLink>
            </li>
          </ul>
        )}
      </div>
      <div className="sidebar-footer" style={{ marginTop: "auto" }}>
        <div
          className="nav-item logout-link"
          onClick={onLogout}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Çıkış Yap</span>
        </div>
      </div>
    </nav>
  );
}
