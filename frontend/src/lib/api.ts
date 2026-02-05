export const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export async function initUser(token: string) {
  const res = await fetch(`${API_BASE}/users/init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to initialize user");
  }

  return res.json();
}