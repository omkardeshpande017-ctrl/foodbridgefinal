import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import { signUser } from '../utils/jwt.js';
import { auth } from '../middleware/auth.js';
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
    const user = await User.findOne({ email }).select('+passwordHash');
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
    // Do not leak the password hash through the response.
    user.passwordHash = undefined;
    await audit(req, 'auth.login', { entity: 'User', entityId: user._id, meta: { role: user.role } });
    res.json({ token: signUser(user), user: safeUser(user) });
  } catch (e) {
    console.error('Login failed', e);
    res.status(500).json({ message: 'Could not sign in' });
  }
});

// ---------------------------------------------------------------------------
// Password management
// ---------------------------------------------------------------------------
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Change password for the signed-in user.
r.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: 'The new password must be between 8 and 128 characters' });
    }
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, user.passwordHash || ''))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    await audit(req, 'auth.password_changed', { entity: 'User', entityId: user._id });
    res.json({ message: 'Password updated' });
  } catch (e) {
    console.error('change password', e);
    res.status(500).json({ message: 'Could not change password' });
  }
});

// Request a reset link. The response is identical whether or not the email
// exists, so the endpoint cannot be used to enumerate accounts.
r.post('/forgot-password', async (req, res) => {
  const generic = { message: 'If that email is registered, a password reset link has been sent.' };
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!isEmail(email)) return res.status(400).json({ message: 'A valid email is required' });
    const user = await User.findOne({ email }).select('+resetTokenHash +resetTokenExpires');
    if (user && user.status === 'active') {
      const token = crypto.randomBytes(32).toString('base64url');
      user.resetTokenHash = hashToken(token);
      user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      await audit(req, 'auth.password_reset_requested', { entity: 'User', entityId: user._id });
      // Email delivery is only possible when a provider is configured; the token
      // is returned ONLY in that case (never silently, never logged in production).
      if (process.env.RESET_LINK_BASE && process.env.SMTP_URL) {
        // Provider integration point: send `${RESET_LINK_BASE}?token=${token}`.
        console.log('password reset requested for', user.email);
      } else if (process.env.NODE_ENV !== 'production') {
        return res.json({ ...generic, devResetToken: token });
      }
    }
    res.json(generic);
  } catch (e) {
    console.error('forgot password', e);
    res.json(generic);
  }
});

r.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !token) return res.status(400).json({ message: 'A reset token is required' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'The new password must be between 8 and 128 characters' });
    }
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpires: { $gt: new Date() }
    }).select('+passwordHash +resetTokenHash +resetTokenExpires');
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    await audit(req, 'auth.password_reset', { entity: 'User', entityId: user._id });
    res.json({ message: 'Password updated. You can sign in now.' });
  } catch (e) {
    console.error('reset password', e);
    res.status(500).json({ message: 'Could not reset password' });
  }
});

export default r;
