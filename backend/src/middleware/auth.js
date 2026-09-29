import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || 'foodbridge_change_this_secret'
    );

    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export const roles = (...allowed) => (req, res, next) =>
  allowed.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'Access denied' });