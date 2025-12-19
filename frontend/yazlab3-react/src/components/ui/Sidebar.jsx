import { NavLink } from "react-router-dom";
import "../../styles/sidebar.css";

export default function Sidebar({ role }) {
  return (
    <nav className="sidebar-container">
      {/* 👑 ADMIN MENÜSÜ */}
      {role === "admin" && (
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
              to="/admin/stations"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="fa-solid fa-location-dot"></i>
              <span>İstasyon Yönetimi</span>
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
              to="/admin/reports"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="fa-solid fa-chart-column"></i>
              <span>Raporlar</span>
            </NavLink>
          </li>
        </ul>
      )}

      {/* 📦 KULLANICI MENÜSÜ */}
      {role === "user" && (
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
              to="/user/route"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="fa-solid fa-map-location-dot"></i>
              <span>Güzergahım</span>
            </NavLink>
          </li>
        </ul>
      )}

      {/* 🚪 ALT BÖLÜM (ÇIKIŞ) */}
      <div className="sidebar-footer">
        <NavLink to="/login" className="nav-item logout-link">
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Çıkış Yap</span>
        </NavLink>
      </div>
    </nav>
  );
}
