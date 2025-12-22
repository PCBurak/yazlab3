import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// --- IMPORTS ---
import Login from "./components/Login"; 
import Register from "./components/Register";

// Import your existing pages (Ensure they are in src/pages folder)
import AdminScenarioPage from "./pages/AdminScenarioPage";
import UserCargoPage from "./pages/UserCargoPage"; 

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 1. Check if user is logged in (session persistence)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Logout Logic
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <div>
      {/* NAVBAR (Only visible when logged in) */}
      {user && (
        <nav style={{ 
          padding: "15px 30px", 
          backgroundColor: "#1f1f1f", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          borderBottom: "1px solid #333",
          marginBottom: "20px"
        }}>
          <span style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#fff" }}>
             Project III | <span style={{color: user.role === "Admin" ? "#646cff" : "#28a745"}}>{user.role} Panel</span>
          </span>
          <div style={{display: "flex", gap: "15px", alignItems: "center", color: "white"}}>
            <span>Welcome, <b>{user.username}</b></span>
            <button 
                onClick={handleLogout} 
                style={{ backgroundColor: "#d9534f", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}
            >
                Logout
            </button>
          </div>
        </nav>
      )}

      {/* ROUTING LOGIC */}
      <Routes>
        {/* If user is NOT logged in, show Login. Else redirect to their dashboard */}
        <Route path="/" element={!user ? <Login onLogin={setUser} /> : <Navigate to={user.role === "Admin" ? "/admin" : "/user"} />} />
        
        {/* Registration Page */}
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === "Admin" ? "/admin" : "/user"} />} />

        {/* PROTECTED ADMIN ROUTE */}
        <Route 
          path="/admin" 
          element={user && user.role === "Admin" ? <AdminScenarioPage /> : <Navigate to="/" />} 
        />

        {/* PROTECTED USER ROUTE (This uses your unmodified UserCargoPage) */}
        <Route 
          path="/user" 
          element={user && user.role === "User" ? <UserCargoPage /> : <Navigate to="/" />} 
        />
      </Routes>
    </div>
  );
}

export default App;