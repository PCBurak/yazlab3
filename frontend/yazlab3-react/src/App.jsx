import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CargoSend from "./pages/CargoSend";
import StationManagement from "./pages/StationManagement";

function App() {
  const users = [
    { email: "admin@test.com", name: "Admin", role: "admin" },
    { email: "user@test.com", name: "User", role: "user" },
  ];

  const navigate = useNavigate();

  const handleLogin = (user) => {
    console.log("Giriş yapan:", user);

    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/user");
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Login users={users} onLogin={handleLogin} />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/user" element={<UserDashboard />} />
      <Route path="/user/send" element={<CargoSend />} />
      <Route path="/admin/stations" element={<StationManagement />} />
    </Routes>
  );
}

export default App;
