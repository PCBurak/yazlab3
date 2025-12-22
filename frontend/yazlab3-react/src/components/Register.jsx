import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5014/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }

      alert("Registration successful! Please login.");
      navigate("/"); 

    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{marginTop: 0, color: "white"}}>Create Account</h2>
        <form onSubmit={handleRegister}>
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
          <div style={styles.inputGroup}>
            <label style={{color: "#ddd"}}>Role</label>
            <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                style={styles.input}
            >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
            </select>
          </div>

          {error && <p style={{ color: "#ff6b6b", fontSize: "0.9em" }}>{error}</p>}
          <button type="submit" style={styles.button}>Register</button>
        </form>
        <p style={{marginTop: "15px", fontSize: "0.9em", color: "#bbb"}}>
          Already have an account? <Link to="/" style={{color: "#646cff"}}>Login here</Link>
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
  button: { width: "100%", padding: "12px", marginTop: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }
};

export default Register;