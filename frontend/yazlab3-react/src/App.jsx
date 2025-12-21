import { useState } from "react";
import { requestCargo } from "./api";
import AdminScenarioPage from "./pages/AdminScenarioPage";





function App() {
  const [stationId, setStationId] = useState("");
  const [cargoCount, setCargoCount] = useState("");
  const [totalWeightKg, setTotalWeightKg] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    const data = await requestCargo({
      stationId: Number(stationId),
      cargoCount: Number(cargoCount),
      totalWeightKg: Number(totalWeightKg),
    });

    setResult(data);
  }

return (
  <div style={{ padding: 20 }}>
    {/* ================= USER ================= */}
    <h2>Cargo Request (User)</h2>

    <form onSubmit={handleSubmit}>
      <input
        placeholder="Station ID"
        value={stationId}
        onChange={(e) => setStationId(e.target.value)}
      />
      <br />

      <input
        placeholder="Cargo Count"
        value={cargoCount}
        onChange={(e) => setCargoCount(e.target.value)}
      />
      <br />

      <input
        placeholder="Total Weight (kg)"
        value={totalWeightKg}
        onChange={(e) => setTotalWeightKg(e.target.value)}
      />
      <br />

      <button type="submit">Submit</button>
    </form>

    {result && (
      <pre>{JSON.stringify(result, null, 2)}</pre>
    )}

    <hr style={{ margin: "40px 0" }} />

    {/* ================= ADMIN ================= */}
    <AdminScenarioPage />
  </div>
);

}

export default App;
