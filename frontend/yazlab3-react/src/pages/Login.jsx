import { useState } from "react";
import "./login.css";

export default function Login({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();

    // 🔍 Dummy user kontrolü
    const user = users.find((u) => u.email === username);

    if (!user) {
      alert("Kullanıcı bulunamadı");
      return;
    }

    // şifre kontrolü yok (dummy)
    onLogin(user);
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-header">
          <div className="truck-icon">
            <i className="fa-solid fa-truck"></i>
          </div>
          <h1>Kargo Yönetim Sistemi</h1>
          <p>Kullanıcı bilgilerinizi giriniz</p>
        </div>

        <div className="field">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Kullanıcı Adı (email)</label>
        </div>

        <div className="field password-field">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Şifre</label>

          <span
            className="eye-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            <i
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
            ></i>
          </span>
        </div>

        <button className="login-btn">Giriş Yap</button>

        <div className="login-footer">
          Kocaeli İlçeleri · Kargo Takip ve Yönetim Sistemi
        </div>
      </form>
    </div>
  );
}
