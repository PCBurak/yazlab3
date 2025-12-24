import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5014/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Giriş başarısız.");

      const userData = await response.json();
      onLogin(userData); // Update App State
    } catch (err) {
      setError("Kullanıcı adı veya şifre hatalı.");
    }
  }

  return (
    <div className="login-wrapper">
      {/* Dekoratif Arka Plan */}
      <div className="bg-decoration top-left"></div>
      <div className="bg-decoration bottom-right"></div>

      <div className="login-card-modern">
        <div className="login-header">
          <div className="logo-box">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <h1>LOGI-TECH</h1>
          <p className="subtitle">Kargo Yönetim Sistemine Giriş</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* USERNAME */}
          <div className="modern-field">
            <label>Kullanıcı Adı</label>
            <div className="input-with-icon">
              <i className="fa-regular fa-envelope"></i>
              <input
                type="text"
                placeholder="ornek@kargo.com"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="modern-field">
            <label>Şifre</label>
            <div className="input-with-icon">
              <i className="fa-solid fa-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </span>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="error-message">
              <i className="fa-solid fa-circle-exclamation"></i> {error}
            </div>
          )}

          {/* SUBMIT */}
          <button className="modern-login-btn">
            <span>Sisteme Bağlan</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div className="login-footer-text">
          <p>
            Henüz bir hesabınız yok mu?{" "}
            <Link to="/register" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>
              Hemen Kayıt Ol
            </Link>
          </p>
          <div className="footer-dots">
            <span className="dot online"></span>
            <span>Sistem Çevrimiçi</span>
          </div>
        </div>
      </div>
    </div>
  );
}