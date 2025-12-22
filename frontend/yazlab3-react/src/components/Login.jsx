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
      
      // Save session
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Update App state
      onLogin(userData);

      // Redirect Traffic
      if (userData.role === "Admin") navigate("/admin");
      else navigate("/user");

    } catch (err) {
      setError("Invalid username or password");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{marginTop: 0, color: "white"}}>Login</h2>
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={{color: "#ddd"}}>Username</label>
            <input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={{color: "#ddd"}}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input}
              required
            />
          </div>
          {error && <p style={{ color: "#ff6b6b", fontSize: "0.9em" }}>{error}</p>}
          <button type="submit" style={styles.button}>Sign In</button>
        </form>
        <p style={{marginTop: "15px", fontSize: "0.9em", color: "#bbb"}}>
          Don't have an account? <Link to="/register" style={{color: "#646cff"}}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", width: "100vw", backgroundColor: "#242424", position: "fixed", top: 0, left: 0 },
  card: { padding: "30px", backgroundColor: "#333", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", width: "350px", textAlign: "center" },
  inputGroup: { marginBottom: "15px", display: "flex", flexDirection: "column", textAlign: "left" },
  input: { padding: "10px", marginTop: "5px", borderRadius: "5px", border: "1px solid #555", backgroundColor: "#444", color: "white", fontSize: "16px" },
  button: { width: "100%", padding: "12px", marginTop: "10px", backgroundColor: "#646cff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }
};

export default Login;