const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SESSION_KEY = 'foodbridge_session';

export const session = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
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
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  donations: (query = '') => request(`/donations${query}`),
  createDonation: (body) => request('/donations', { method: 'POST', body: JSON.stringify(body) }),
  acceptDonation: (id) => request(`/donations/${id}/accept`, { method: 'POST' }),
  status: (id, status) => request(`/donations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deliveries: () => request('/deliveries'),
  createDelivery: (body) => request('/deliveries', { method: 'POST', body: JSON.stringify(body) }),
  updateDelivery: (id, body) => request(`/deliveries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  summary: () => request('/analytics/summary'),
  overview: () => request('/analytics/overview'),
  ai: () => request('/ai/insights'),
  notifications: () => request('/notifications'),
  readNotification: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  users: () => request('/users'),
  userStatus: (id, status) => request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  me: () => request('/users/me'),
  updateMe: (body) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  report: () => request('/reports/summary')
};
