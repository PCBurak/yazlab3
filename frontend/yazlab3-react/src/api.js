const API_BASE_URL = "http://localhost:5014/api";

async function readResponse(response) {
  const text = await response.text();

  try {
    return { ok: response.ok, status: response.status, data: JSON.parse(text) };
  } catch {
    return { ok: response.ok, status: response.status, data: text };
  }
}

export async function requestCargo(payload) {
  const response = await fetch(`${API_BASE_URL}/user/request-cargo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await readResponse(response);
  if (!result.ok) throw new Error(typeof result.data === "string" ? result.data : "Request failed");
  return result.data;
}

export async function runScenario(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/run-scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await readResponse(response);
  if (!result.ok) throw new Error(typeof result.data === "string" ? result.data : "Scenario failed");
  return result.data;
}
