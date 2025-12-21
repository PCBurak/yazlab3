const API_BASE_URL = "http://localhost:5014/api";

export async function requestCargo(data) {
  const response = await fetch(`${API_BASE_URL}/user/request-cargo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.json();
}
