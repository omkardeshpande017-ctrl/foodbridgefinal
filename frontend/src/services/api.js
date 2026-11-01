const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
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

async function request(path, options = {}) {
  const s = session();
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && s?.token) {
    // Expired or revoked session: drop it so the app returns to the login screen.
    clearSession();
  }
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? `?${new URLSearchParams(clean).toString()}` : '';
};

export const api = {
  // auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
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
