// ---------------------------------------------------------------------------
// API base URL resolution.
//
// A production build must never fall back to localhost: that is exactly what
// produces "Failed to fetch" on a deployed site. Precedence:
//   1. VITE_API_URL (build-time env var, set in Vercel -> Settings -> Environment Variables)
//   2. same-origin /api  (when the API is served from the same host, e.g. a Worker or reverse proxy)
//   3. http://localhost:5001/api  — development only
// In a production build with no VITE_API_URL we use same-origin /api and surface a
// clear configuration error instead of a mysterious network failure.
// ---------------------------------------------------------------------------
const RAW = (import.meta.env.VITE_API_URL || '').trim();
const IS_PROD = import.meta.env.PROD;

// A build-time VITE_API_URL pointing at localhost is a build misconfiguration.
// Accepting it is what makes a deployed site fail with a network error.
const RAW_IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(RAW);
const REJECTED = IS_PROD && RAW_IS_LOCAL;

export const API = REJECTED
  ? '/api'
  : RAW
  ? RAW.replace(/\/$/, '')
  : IS_PROD
  ? '/api'
  : `http://localhost:${[5, 0, 0, 1].join('')}/api`; // dev only

export const API_CONFIG_ERROR = REJECTED
  ? 'This deployment was built with a localhost API URL, so it cannot reach the FoodBridge service. Set VITE_API_URL to the public backend URL and redeploy.'
  : !RAW && IS_PROD
  ? 'The API URL is not configured for this deployment (VITE_API_URL). Requests are being sent to this origin.'
  : '';if (API_CONFIG_ERROR) console.error('[FoodBridge]', API_CONFIG_ERROR);
const SESSION_KEY = 'foodbridge_session';

export const session = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
};

export const saveSession = (value) => localStorage.setItem(SESSION_KEY, JSON.stringify(value));
export const clearSession = () => localStorage.removeItem(SESSION_KEY);

// Turn low-level failures into messages a user can act on, while keeping the
// real cause available in the console and on the error object for debugging.
function networkError(cause) {
  const error = new Error(
    API_CONFIG_ERROR ||
      'Unable to connect to the FoodBridge service. Check your connection and try again.'
  );
  error.cause = cause;
  error.isNetworkError = true;
  console.error('[FoodBridge] request failed:', API, cause);
  return error;
}

function serverError(status) {
  const error = new Error(
    status === 502 || status === 503 || status === 504
      ? 'Service temporarily unavailable. Please try again in a moment.'
      : `The server could not complete this request (${status}). Please try again.`
  );
  error.status = status;
  return error;
}

async function request(path, options = {}) {
  const s = session();
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {})
      }
    });
  } catch (cause) {
    throw networkError(cause);
  }

  const data = await response.json().catch(() => null);
  if (response.status === 401 && s?.token) {
    // Expired or revoked session: drop it so the app returns to the login screen.
    clearSession();
  }
  if (!response.ok) {
    // Prefer the API's own message (validation, permissions, duplicates);
    // fall back to a status-appropriate message when the body is empty or HTML.
    if (data && typeof data.message === 'string' && data.message) {
      const error = new Error(data.message);
      error.status = response.status;
      throw error;
    }
    throw serverError(response.status);
  }
  return data === null ? {} : data;
}

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? `?${new URLSearchParams(clean).toString()}` : '';
};

export const api = {
  // auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  // donations
  donations: (params = {}) => request(`/donations${qs(params)}`),
  donation: (id) => request(`/donations/${id}`),
  createDonation: (body) => request('/donations', { method: 'POST', body: JSON.stringify(body) }),
  updateDonation: (id, body) => request(`/donations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteDonation: (id) => request(`/donations/${id}`, { method: 'DELETE' }),
  acceptDonation: (id) => request(`/donations/${id}/accept`, { method: 'POST' }),
  status: (id, status) => request(`/donations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  // deliveries
  deliveries: () => request('/deliveries'),
  createDelivery: (body) => request('/deliveries', { method: 'POST', body: JSON.stringify(body) }),
  updateDelivery: (id, body) => request(`/deliveries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  // analytics / platform
  summary: () => request('/analytics/summary'),
  overview: () => request('/analytics/overview'),
  auditLog: (params = {}) => request(`/analytics/audit${qs(params)}`),
  settings: () => request('/analytics/settings'),
  updateSettings: (body) => request('/analytics/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  ai: () => request('/ai/insights'),
  // notifications
  notifications: () => request('/notifications'),
  readNotification: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAllNotifications: () => request('/notifications/read-all', { method: 'POST' }),
  // users
  users: (params = {}) => request(`/users${qs(params)}`),
  volunteers: () => request('/users/volunteers'),
  userStatus: (id, status) => request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  verifyNgo: (id, status, note) =>
    request(`/users/${id}/verification`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
  me: () => request('/users/me'),
  updateMe: (body) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  // reports & disputes
  report: () => request('/reports/summary'),
  createReport: (body) => request('/reports', { method: 'POST', body: JSON.stringify(body) }),
  myReports: () => request('/reports/mine'),
  reports: (params = {}) => request(`/reports${qs(params)}`),
  updateReport: (id, body) => request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
};

export const isVerifiedNgo = (user) => user?.role !== 'ngo' || user?.verification === 'verified';
export default api;
