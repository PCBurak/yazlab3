import { useState } from "react";
import { requestCargo } from "../services/api";

export default function UserCargoPage() {
  const [stationId, setStationId] = useState("");
  const [cargoCount, setCargoCount] = useState("");
  const [totalWeightKg, setTotalWeightKg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      const data = await requestCargo({
        stationId: Number(stationId),
        cargoCount: Number(cargoCount),
        totalWeightKg: Number(totalWeightKg)
      });

      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Cargo Request</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Station ID</label>
          <input value={stationId} onChange={e => setStationId(e.target.value)} />
        </div>

        <div>
          <label>Cargo Count</label>
          <input value={cargoCount} onChange={e => setCargoCount(e.target.value)} />
        </div>

        <div>
          <label>Total Weight (kg)</label>
          <input value={totalWeightKg} onChange={e => setTotalWeightKg(e.target.value)} />
        </div>

        <button type="submit">Submit</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div>
          <h3>Result</h3>
          <p>Vehicle ID: {result.vehicleId}</p>
          <p>Total Distance: {result.totalDistanceKm}</p>
          <p>Total Cost: {result.totalCost}</p>
        </div>
      )}
    </div>
  );
}
