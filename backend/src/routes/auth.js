import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import { signUser } from '../utils/jwt.js';
import { audit } from '../utils/audit.js';
import { isEmail, str } from '../utils/validate.js';

const r = Router();
const publicRoles = new Set(['donor', 'ngo', 'volunteer']);

export const safeUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  location: u.location,
  organization: u.organization,
  verification: u.verification?.status || 'not_required',
  status: u.status,
  available: u.available
});

r.post('/register', async (req, res) => {
  try {
    const b = req.body || {};
    const name = str(b.name, 120);
    const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
    const password = typeof b.password === 'string' ? b.password : '';
    const role = publicRoles.has(b.role) ? b.role : undefined;

    if (!name || !isEmail(email) || !password || !role) {
      return res.status(400).json({
        message: 'Name, a valid email, a password and a Donor/NGO/Volunteer role are required. Admin accounts are provisioned privately.'
      });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
    }
    if (role === 'ngo' && !str(b.organization, 160)) {
      return res.status(400).json({ message: 'An organisation name is required to register as an NGO.' });
    }
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });

    const settings = await Setting.findOne({ key: 'platform' }).lean();
    const needsVerification = role === 'ngo' && (settings?.requireNgoVerification ?? true);

    const user = await User.create({
      name,
      email,
      phone: str(b.phone, 30),
      passwordHash: await bcrypt.hash(password, 12),
      role,
      location: str(b.location, 160),
      organization: str(b.organization, 160),
      registrationNumber: str(b.registrationNumber, 80),
      skills: Array.isArray(b.skills) ? b.skills.slice(0, 10).map((s) => str(s, 60)).filter(Boolean) : [],
      verification: { status: needsVerification ? 'pending' : 'not_required' }
    });

    await audit(req, 'user.register', { entity: 'User', entityId: user._id, meta: { role } });
    res.status(201).json({
      token: signUser(user),
      user: safeUser(user),
      notice: needsVerification
        ? 'Your NGO account is pending verification. You can browse donations, but accepting them starts once an administrator verifies your organisation.'
        : undefined
    });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    console.error('Registration failed', e);
    res.status(500).json({ message: 'Could not create account' });
  }
});

r.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    const user = await User.findOne({ email });
    if (
      !user ||
      user.status !== 'active' ||
      typeof password !== 'string' ||
      !(await bcrypt.compare(password, user.passwordHash || ''))
    ) {
      await audit(req, 'auth.login_failed', { entity: 'User', entityId: user?._id, meta: { email } });
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // Role always comes from the database; a client-supplied role never grants privileges.
    user.lastLoginAt = new Date();
    await user.save();
    await audit(req, 'auth.login', { entity: 'User', entityId: user._id, meta: { role: user.role } });
    res.json({ token: signUser(user), user: safeUser(user) });
  } catch (e) {
    console.error('Login failed', e);
    res.status(500).json({ message: 'Could not sign in' });
  }
});

export default r;
