import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signUser } from '../utils/jwt.js';

const r = Router();
const publicRoles = new Set(['donor', 'ngo', 'volunteer']);
const safeUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, location: u.location, organization: u.organization });

r.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, location, organization, skills } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!name?.trim() || !normalizedEmail || !password || !publicRoles.has(role)) {
      return res.status(400).json({ message: 'Name, valid email, password, and a Donor/NGO/Volunteer role are required. Admin accounts are provisioned privately.' });
    }
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'Email already registered' });
    const u = await User.create({ name: name.trim(), email: normalizedEmail, phone, passwordHash: await bcrypt.hash(password, 12), role, location, organization, skills });
    res.status(201).json({ token: signUser(u), user: safeUser(u) });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    console.error('Registration failed', e); res.status(500).json({ message: 'Could not create account' });
  }
});

r.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    const u = await User.findOne({ email });
    if (!u || u.status !== 'active' || typeof password !== 'string' || !(await bcrypt.compare(password, u.passwordHash || ''))) return res.status(401).json({ message: 'Invalid email or password' });
    // Role is always taken from the database; a client-supplied role never grants privileges.
    res.json({ token: signUser(u), user: safeUser(u) });
  } catch (e) { console.error('Login failed', e); res.status(500).json({ message: 'Could not sign in' }); }
});
export default r;
