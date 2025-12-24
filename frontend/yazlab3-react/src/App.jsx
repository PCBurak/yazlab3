import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

// --- IMPORT PAGES ---
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CargoSend from "./pages/CargoSend";
import RoutePlanning from "./pages/RoutePlanning";
import StationManagement from "./pages/StationManagement";
import CargoTracking from "./pages/CargoTracking";

// import StationManagement from "./pages/StationManagement"; // Admin için gerekirse bunu da açabilirsin

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 1. Check LocalStorage on Load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Handle Login
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (userData.role === "Admin") navigate("/admin");
    else navigate("/user");
  };

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      
      {/* Login Page */}
      <Route 
        path="/" 
        element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === "Admin" ? "/admin" : "/user"} />} 
      />

      {/* Register Page */}
      <Route 
        path="/register" 
        element={!user ? <Register /> : <Navigate to={user.role === "Admin" ? "/admin" : "/user"} />} 
      />


      {/* --- PROTECTED ROUTES --- */}

      {/* Admin Dashboard */}
      <Route 
        path="/admin" 
        element={
          user && user.role === "Admin" ? (
            <AdminDashboard onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        } 
      />

      {/* User Dashboard (Ana Panel) */}
      <Route 
        path="/user" 
        element={
          user && user.role === "User" ? (
            <UserDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        } 
      />

      {/* User Cargo Send (Kargo Gönder Sayfası) - YENİ EKLENDİ */}
      <Route 
        path="/user/send" 
        element={
          user && user.role === "User" ? (
            <CargoSend user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        } 
      />
      <Route 
        path="/admin/routes" 
        element={
        user && user.role === "Admin" ? (
            <RoutePlanning onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        } 
      />


      <Route 
        path="/admin/stations" 
        element={
        user && user.role === "Admin" ? (
          <StationManagement onLogout={handleLogout} />
        ) : (
          <Navigate to="/" />
        )
      } 
      />
      <Route 
        path="/user/tracking" 
        element={user && user.role === "User" ? <CargoTracking onLogout={handleLogout} /> : <Navigate to="/" />} 
      />
    </Routes>
  );
}

export default App;