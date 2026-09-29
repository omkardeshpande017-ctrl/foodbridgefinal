import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signUser } from '../utils/jwt.js';

const r = Router();

const normalizeEmail = (value = '') => value.trim().toLowerCase();

r.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      location,
      organization,
      skills,
    } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password || !role) {
      return res.status(400).json({
        message: 'Name, email, password and role are required',
      });
    }

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    const u = await User.create({
      name,
      email: normalizedEmail,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      location,
      organization,
      skills,
    });

    res.status(201).json({
      token: signUser(u),
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        location: u.location,
        organization: u.organization,
      },
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

r.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: 'Email and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const u = await User.findOne({ email: normalizedEmail });

    if (!u) {
      return res.status(404).json({
        message: 'No account found with this email',
      });
    }

    u.passwordHash = await bcrypt.hash(newPassword, 10);
    await u.save();

    res.json({
      message: 'Password changed successfully',
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

r.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const u = await User.findOne({ email: normalizedEmail });
    const passwordMatches =
      !!u?.passwordHash &&
      typeof password === 'string' &&
      await bcrypt.compare(password, u.passwordHash);

    if (!u || u.status !== 'active' || !passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    if (role && role !== u.role) {
      return res.status(401).json({
        message: 'Selected role does not match this account',
      });
    }

    res.json({
      token: signUser(u),
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        location: u.location,
        organization: u.organization,
      },
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

export default r;