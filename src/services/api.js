// Local: http://localhost:8000. Production: set VITE_API_URL in Vercel to your Render URL.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const TOKEN_KEY = "tw_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function messageFrom(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  if (data && Array.isArray(data.detail)) {
    return data.detail
      .map((d) => {
        const field = (d.loc || []).slice(1).join(" ");
        const msg = String(d.msg || "Invalid value").replace(/^Value error, /, "");
        return field ? `${field}: ${msg}` : msg;
      })
      .join(". ");
  }
  return status >= 500 ? "Something went wrong on the server. Please try again." : "Request failed";
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Cannot reach the server. Check your internet connection and try again.", 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    if (res.status === 401 && auth && onUnauthorized) onUnauthorized();
    throw new ApiError(messageFrom(data, res.status), res.status);
  }
  return data;
}

const qs = (p = {}) => {
  const s = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== "" && v != null) s.append(k, v);
  });
  const t = s.toString();
  return t ? `?${t}` : "";
};

export const api = {
  register: (b) => request("/auth/register", { method: "POST", body: b, auth: false }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => request("/auth/me"),
  updateProfile: (b) => request("/auth/me", { method: "PATCH", body: b }),
  changePassword: (b) => request("/auth/me/password", { method: "POST", body: b }),
  createReport: (b) => request("/reports", { method: "POST", body: b }),
  myReports: (p) => request(`/reports/mine${qs(p)}`),
  listReports: (p) => request(`/reports${qs(p)}`),
  getReport: (id) => request(`/reports/${id}`),
  updateStatus: (id, status, note) => request(`/reports/${id}/status`, { method: "PATCH", body: { status, note: note || null } }),
  addNote: (id, note) => request(`/reports/${id}/notes`, { method: "POST", body: { note } }),
  assign: (id, responder_id) => request(`/reports/${id}/assign`, { method: "PATCH", body: { responder_id } }),
  cancelReport: (id) => request(`/reports/${id}/cancel`, { method: "POST" }),
  stats: () => request("/dashboard/stats"),
  activity: () => request("/dashboard/activity"),
  listUsers: (p) => request(`/users${qs(p)}`),
  responders: () => request("/users/responders"),
  createUser: (b) => request("/users", { method: "POST", body: b }),
  updateUser: (id, b) => request(`/users/${id}`, { method: "PATCH", body: b }),
};
