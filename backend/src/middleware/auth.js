import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verifies the JWT, then re-reads the account so suspension, role changes and
// NGO verification take effect immediately instead of at the next token refresh.
export async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('name email role status verification available').lean();
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    if (user.status !== 'active') return res.status(403).json({ message: 'This account is suspended' });
    req.user = {
      id: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email,
      verification: user.verification?.status || 'not_required',
      available: user.available
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export const roles = (...allowed) => (req, res, next) =>
  allowed.includes(req.user.role) ? next() : res.status(403).json({ message: 'Access denied' });
