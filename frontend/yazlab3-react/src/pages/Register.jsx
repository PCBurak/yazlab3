import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User"); 
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const navigate = useNavigate();

  const canSubmit = useMemo(() => {
    return username.length >= 3 && password.length >= 3;
  }, [username, password]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError("Alanları kontrol ediniz.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5014/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Kayıt başarısız.");
      }

      setSuccess("Kayıt başarılı! Yönlendiriliyorsunuz...");
      setTimeout(() => navigate("/"), 2000);

    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="bg-decoration top-left"></div>
      <div className="bg-decoration bottom-right"></div>

      <div className="login-card-modern">
        <div className="login-header">
          <div className="logo-box" style={{background: "#10b981"}}>
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h1>Hesap Oluştur</h1>
          <p className="subtitle">Yeni kullanıcı bilgilerini tanımlayın</p>
        </div>

        <form onSubmit={onSubmit}>
          {/* USERNAME */}
          <div className="modern-field">
            <label>Kullanıcı Adı</label>
            <div className="input-with-icon">
              <i className="fa-regular fa-user"></i>
              <input
                type="text"
                placeholder="Kullanıcı Adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* GRID: PASSWORD & ROLE */}
          <div className="form-grid-two">
            <div className="modern-field">
              <label>Şifre</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-lock"></i>
                <input
                  type="password"
                  placeholder="•••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modern-field">
              <label>Rol</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-user-shield"></i>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  // Uses the same CSS as input thanks to the update in login.css
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* MESSAGES */}
          {error && (
            <div className="error-message">
              <i className="fa-solid fa-circle-exclamation"></i> {error}
            </div>
          )}
          {success && (
            <div className="success-message">
              <i className="fa-solid fa-circle-check"></i> {success}
            </div>
          )}

          {/* BUTTON */}
          <button className="modern-login-btn" disabled={!canSubmit} style={{background: "#10b981"}}>
            <span>Kayıt Ol</span>
            <i className="fa-solid fa-user-check"></i>
          </button>
        </form>

        <div className="login-footer-text">
          <p>
            Zaten hesabınız var mı?{" "}
            <Link to="/" style={{ color: "#10b981", fontWeight: "600", textDecoration: "none" }}>
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}