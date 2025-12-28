import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CargoSend from "./pages/CargoSend";
import RoutePlanning from "./pages/RoutePlanning";
import StationManagement from "./pages/StationManagement";
import CargoTracking from "./pages/CargoTracking";
import StationCargos from "./pages/StationCargos";
import AdminScenarioPage from "./pages/AdminScenarioPage";


function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (userData.role === "Admin") navigate("/admin");
    else navigate("/user");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Navigate to={user.role === "Admin" ? "/admin" : "/user"} />
          )
        }
      />
      <Route
        path="/register"
        element={
          !user ? (
            <Register />
          ) : (
            <Navigate to={user.role === "Admin" ? "/admin" : "/user"} />
          )
        }
      />
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
        element={
          user && user.role === "User" ? (
            <CargoTracking onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/admin/station-cargos"
        element={
          user && user.role === "Admin" ? (
            <StationCargos onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/admin/scenarios"
        element={
          user && user.role === "Admin" ? (
            <AdminScenarioPage onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/admin/settings"
        element={
          user && user.role === "Admin" ? (
            <Settings onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />{" "}
    </Routes>
  );
}

export default App;
