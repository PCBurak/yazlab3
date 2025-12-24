import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5014/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Invalid credentials");

      const userData = await response.json();
      
      // Update App State & Storage
      onLogin(userData);

    } catch (err) {
      setError("Hatalı kullanıcı adı veya şifre.");
    }
  }

  return (
    <div className="dashboard-container" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="card" style={{ width: "400px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#4f46e5", margin: 0 }}>Kargo Panel</h1>
          <p className="subtitle">Lütfen hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label style={{ fontWeight: 500 }}>Kullanıcı Adı</label>
            <input 
              className="modern-select" // Reusing input style
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
              placeholder="admin"
            />
          </div>

          <div className="form-group" style={{ marginTop: "15px" }}>
            <label style={{ fontWeight: 500 }}>Şifre</label>
            <input 
              type="password"
              className="modern-select"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              placeholder="••••••"
            />
          </div>

          {error && (
            <div style={{ color: "#ef4444", marginTop: "15px", fontSize: "14px", textAlign: "center" }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <button 
            type="submit" 
            className="modern-submit-btn" 
            style={{ marginTop: "25px", borderRadius: "8px" }}
          >
            Giriş Yap
          </button>
        </form>

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", color: "#64748b" }}>
          Hesabınız yok mu? <Link to="/register" style={{ color: "#4f46e5", fontWeight: "bold" }}>Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;