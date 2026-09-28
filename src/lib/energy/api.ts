// Thin REST client for the Nexora backend. URL comes from VITE_BACKEND_URL.
// No device secrets live in the frontend; the backend authenticates the user session.
export function backendUrl(): string | undefined {
  const url = import.meta.env['VITE_BACKEND_URL'] as string | undefined;
  return url ? url.replace(/\/$/, "") : undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = backendUrl();
  if (!base) throw new Error("No backend configured");
  const res = await fetch(base + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

export const endpoints = [
  "GET /api/v1/health", "POST /api/v1/devices/register", "GET /api/v1/devices/{device_id}",
  "GET /api/v1/devices/{device_id}/config", "POST /api/v1/loads/register", "GET /api/v1/load-registry",
  "GET /api/v1/telemetry/latest", "GET /api/v1/telemetry/history", "GET /api/v1/priorities/latest",
  "POST /api/v1/feedback", "GET /api/v1/feedback", "POST /api/v1/controls/override",
  "GET /api/v1/dashboard/summary", "GET /api/v1/dashboard/history", "GET /api/v1/alerts",
  "GET /api/v1/models/active", "GET /api/v1/models/history", "POST /api/v1/models/rollback/{version}",
];
