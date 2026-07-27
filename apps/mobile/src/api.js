const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:3001/api";

let safeFetch;
try {
  if (window.__TAURI__) {
    const mod = await import("@tauri-apps/plugin-http");
    safeFetch = mod.fetch;
  } else {
    safeFetch = globalThis.fetch.bind(globalThis);
  }
} catch {
  safeFetch = globalThis.fetch.bind(globalThis);
}

let accessToken = localStorage.getItem("access_token");
let refreshToken = localStorage.getItem("refresh_token");
let refreshPromise = null;

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem("access_token", access);
  else localStorage.removeItem("access_token");
  if (refresh) localStorage.setItem("refresh_token", refresh);
  else localStorage.removeItem("refresh_token");
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getAccessToken() {
  return accessToken;
}

async function tryRefresh() {
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await safeFetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setTokens(data.accessToken, refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const { method = "GET", body, token: explicitToken, _retry } = options;
  const headers = { "Content-Type": "application/json" };
  const useToken = explicitToken || accessToken;
  if (useToken) headers.Authorization = `Bearer ${useToken}`;

  const res = await safeFetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !_retry && refreshToken) {
    const newToken = await tryRefresh();
    if (newToken) {
      return apiFetch(path, { method, body, token: newToken, _retry: true });
    }
    clearTokens();
    window.location.reload();
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export { API_BASE };
