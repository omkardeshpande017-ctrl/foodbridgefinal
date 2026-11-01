// Minimal, dependency-free validation helpers shared by the routes.

export const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.length <= 254;

export const str = (v, max = 200) =>
  typeof v === 'string' ? v.trim().slice(0, max) : undefined;

export const positiveNumber = (v, { min = 0.01, max = 1000000 } = {}) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

export const oneOf = (v, list) => (list.includes(v) ? v : undefined);

// Only http(s) URLs are accepted for optional media fields.
export const isSafeImage = (v) => {
  if (typeof v !== 'string' || !v) return false;
  if (v.length > 1_600_000) return false; // ~1.5 MB inline image
  return /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/.test(v);
};

export const pagination = (query, { defaultLimit = 24, maxLimit = 100 } = {}) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(query.page, 10) || 1));
  const limit = Math.max(1, Math.min(maxLimit, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};
